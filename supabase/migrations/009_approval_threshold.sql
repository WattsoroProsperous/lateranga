-- Migration 009: Ajout du seuil d'approbation pour les retraits d'ingrédients
-- Si la quantité demandée dépasse ce seuil, une approbation admin est requise

-- Ajouter le type 'withdrawal' à l'enum stock_movement_type
ALTER TYPE stock_movement_type ADD VALUE IF NOT EXISTS 'withdrawal';

-- Ajouter la colonne approval_threshold aux ingrédients
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS approval_threshold DECIMAL(10,3) DEFAULT NULL;

-- Commentaire explicatif
COMMENT ON COLUMN ingredients.approval_threshold IS 'Seuil au-delà duquel une approbation admin est requise pour un retrait. NULL = pas de limite.';

-- Ajouter une colonne pour les demandes de retrait en attente d'approbation
-- On va réutiliser la table ingredient_requests avec un nouveau type de requête

-- Ajouter un type pour distinguer les demandes de stock vs les demandes de retrait
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_type') THEN
    CREATE TYPE request_type AS ENUM ('stock_request', 'withdrawal_approval');
  END IF;
END$$;

-- Ajouter la colonne request_type à ingredient_requests si elle n'existe pas
ALTER TABLE ingredient_requests ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'stock_request';

-- Ajouter la colonne requested_by pour savoir qui a fait la demande
ALTER TABLE ingredient_requests ADD COLUMN IF NOT EXISTS requested_by UUID REFERENCES auth.users(id);

-- Ajouter la colonne notes pour les commentaires
ALTER TABLE ingredient_requests ADD COLUMN IF NOT EXISTS notes TEXT;

-- Mettre à jour la fonction de retrait du chef pour vérifier le seuil
CREATE OR REPLACE FUNCTION chef_withdraw_ingredient(
  p_ingredient_id UUID,
  p_quantity DECIMAL,
  p_note TEXT DEFAULT NULL,
  p_chef_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ingredient RECORD;
  v_new_quantity DECIMAL;
  v_movement_id UUID;
  v_request_id UUID;
  v_needs_approval BOOLEAN := FALSE;
BEGIN
  -- Récupérer l'ingrédient avec son seuil d'approbation
  SELECT * INTO v_ingredient
  FROM ingredients
  WHERE id = p_ingredient_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ingrédient non trouvé');
  END IF;

  -- Vérifier si le seuil d'approbation est dépassé
  IF v_ingredient.approval_threshold IS NOT NULL AND p_quantity > v_ingredient.approval_threshold THEN
    v_needs_approval := TRUE;
  END IF;

  -- Vérifier le stock disponible
  IF p_quantity > v_ingredient.current_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Stock insuffisant',
      'available', v_ingredient.current_quantity
    );
  END IF;

  -- Si approbation requise, créer une demande au lieu de retirer directement
  IF v_needs_approval THEN
    INSERT INTO ingredient_requests (
      ingredient_id,
      quantity,
      notes,
      status,
      request_type,
      requested_by
    ) VALUES (
      p_ingredient_id,
      p_quantity,
      COALESCE(p_note, 'Retrait cuisine - approbation requise'),
      'pending',
      'withdrawal_approval',
      p_chef_id
    )
    RETURNING id INTO v_request_id;

    -- Créer une notification pour l'admin
    INSERT INTO notifications (
      type,
      title,
      message,
      data
    ) VALUES (
      'ingredient_request',
      'Demande de retrait importante',
      format('Retrait de %s %s de %s nécessite approbation',
        p_quantity, v_ingredient.unit, v_ingredient.name),
      jsonb_build_object(
        'request_id', v_request_id,
        'ingredient_id', p_ingredient_id,
        'ingredient_name', v_ingredient.name,
        'quantity', p_quantity,
        'threshold', v_ingredient.approval_threshold,
        'request_type', 'withdrawal_approval'
      )
    );

    RETURN jsonb_build_object(
      'success', true,
      'needs_approval', true,
      'request_id', v_request_id,
      'message', format('Quantité (%s) dépasse le seuil (%s). Demande envoyée à l''admin.',
        p_quantity, v_ingredient.approval_threshold)
    );
  END IF;

  -- Retrait immédiat si sous le seuil ou pas de seuil
  v_new_quantity := v_ingredient.current_quantity - p_quantity;

  -- Mettre à jour le stock
  UPDATE ingredients
  SET current_quantity = v_new_quantity,
      updated_at = now()
  WHERE id = p_ingredient_id;

  -- Créer le mouvement de stock
  INSERT INTO stock_movements (
    ingredient_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_type,
    note,
    performed_by
  ) VALUES (
    p_ingredient_id,
    'withdrawal',
    p_quantity,
    v_ingredient.current_quantity,
    v_new_quantity,
    'chef_withdrawal',
    COALESCE(p_note, 'Retrait cuisine'),
    p_chef_id
  )
  RETURNING id INTO v_movement_id;

  -- Vérifier le stock bas
  IF v_new_quantity <= v_ingredient.min_threshold THEN
    INSERT INTO notifications (
      type,
      title,
      message,
      data
    ) VALUES (
      'low_stock',
      'Stock bas: ' || v_ingredient.name,
      format('Le stock de %s est bas (%s %s restants)',
        v_ingredient.name, v_new_quantity, v_ingredient.unit),
      jsonb_build_object(
        'ingredient_id', p_ingredient_id,
        'ingredient_name', v_ingredient.name,
        'current_quantity', v_new_quantity,
        'min_threshold', v_ingredient.min_threshold
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'needs_approval', false,
    'movement_id', v_movement_id,
    'new_quantity', v_new_quantity,
    'message', format('Retrait effectué. Nouveau stock: %s %s', v_new_quantity, v_ingredient.unit)
  );
END;
$$;

-- Fonction pour approuver une demande de retrait
CREATE OR REPLACE FUNCTION approve_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_ingredient RECORD;
  v_new_quantity DECIMAL;
  v_movement_id UUID;
BEGIN
  -- Récupérer la demande
  SELECT * INTO v_request
  FROM ingredient_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Demande non trouvée ou déjà traitée');
  END IF;

  -- Récupérer l'ingrédient
  SELECT * INTO v_ingredient
  FROM ingredients
  WHERE id = v_request.ingredient_id;

  -- Vérifier le stock
  IF v_request.quantity > v_ingredient.current_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Stock insuffisant',
      'available', v_ingredient.current_quantity
    );
  END IF;

  -- Effectuer le retrait
  v_new_quantity := v_ingredient.current_quantity - v_request.quantity;

  UPDATE ingredients
  SET current_quantity = v_new_quantity,
      updated_at = now()
  WHERE id = v_request.ingredient_id;

  -- Créer le mouvement
  INSERT INTO stock_movements (
    ingredient_id,
    movement_type,
    quantity,
    previous_quantity,
    new_quantity,
    reference_type,
    note,
    performed_by
  ) VALUES (
    v_request.ingredient_id,
    'withdrawal',
    v_request.quantity,
    v_ingredient.current_quantity,
    v_new_quantity,
    'chef_withdrawal',
    format('Retrait approuvé - %s', COALESCE(v_request.notes, '')),
    p_admin_id
  )
  RETURNING id INTO v_movement_id;

  -- Mettre à jour le statut de la demande
  UPDATE ingredient_requests
  SET status = 'approved',
      approved_by = p_admin_id,
      approved_at = now(),
      updated_at = now()
  WHERE id = p_request_id;

  -- Notification de confirmation
  INSERT INTO notifications (
    type,
    title,
    message,
    data,
    user_id
  ) VALUES (
    'request_approved',
    'Retrait approuvé',
    format('Votre demande de retrait de %s %s de %s a été approuvée',
      v_request.quantity, v_ingredient.unit, v_ingredient.name),
    jsonb_build_object(
      'request_id', p_request_id,
      'ingredient_name', v_ingredient.name,
      'quantity', v_request.quantity
    ),
    v_request.requested_by
  );

  RETURN jsonb_build_object(
    'success', true,
    'movement_id', v_movement_id,
    'new_quantity', v_new_quantity
  );
END;
$$;

-- Fonction pour rejeter une demande de retrait
CREATE OR REPLACE FUNCTION reject_withdrawal_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_ingredient RECORD;
BEGIN
  -- Récupérer la demande
  SELECT ir.*, i.name as ingredient_name, i.unit
  INTO v_request
  FROM ingredient_requests ir
  JOIN ingredients i ON i.id = ir.ingredient_id
  WHERE ir.id = p_request_id AND ir.status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Demande non trouvée ou déjà traitée');
  END IF;

  -- Mettre à jour le statut
  UPDATE ingredient_requests
  SET status = 'rejected',
      approved_by = p_admin_id,
      approved_at = now(),
      notes = COALESCE(p_reason, notes),
      updated_at = now()
  WHERE id = p_request_id;

  -- Notification de rejet
  INSERT INTO notifications (
    type,
    title,
    message,
    data,
    user_id
  ) VALUES (
    'request_rejected',
    'Retrait refusé',
    format('Votre demande de retrait de %s %s de %s a été refusée. %s',
      v_request.quantity, v_request.unit, v_request.ingredient_name,
      COALESCE('Raison: ' || p_reason, '')),
    jsonb_build_object(
      'request_id', p_request_id,
      'ingredient_name', v_request.ingredient_name,
      'quantity', v_request.quantity,
      'reason', p_reason
    ),
    v_request.requested_by
  );

  RETURN jsonb_build_object('success', true);
END;
$$;
