# La Teranga - Instructions Claude

## Base de données Supabase (Docker local)

### Règle importante pour les modifications de base de données

**À chaque modification de schéma de base de données :**

1. **Créer d'abord la migration** dans `supabase/migrations/XXX_nom_migration.sql`
2. **Appliquer la migration** sur le conteneur Docker :
   ```bash
   docker exec -i supabase_db_lateranga psql -U postgres -d postgres < supabase/migrations/XXX_nom_migration.sql
   ```
   Ou avec heredoc pour du SQL inline :
   ```bash
   docker exec -i supabase_db_lateranga psql -U postgres -d postgres << 'EOSQL'
   -- SQL ici
   EOSQL
   ```

3. **Vérifier** que la migration a été appliquée :
   ```bash
   docker exec -i supabase_db_lateranga psql -U postgres -d postgres -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
   ```

### Conteneurs Docker Supabase

- **PostgreSQL** : `supabase_db_lateranga`
- **Auth** : `supabase_auth_lateranga`
- **Storage** : `supabase_storage_lateranga`
- **Realtime** : `supabase_realtime_lateranga`

### Structure des migrations

Les migrations sont numérotées séquentiellement :
- `001_init.sql` - Schéma initial
- `002_enhanced_roles.sql` - Système de rôles
- `003_tables.sql` - Gestion des tables restaurant
- `004_stock_management.sql` - Gestion du stock
- `005_payment_system.sql` - Système de paiement
- `006_notifications.sql` - Notifications
- `007_fix_profiles_rls.sql` - Correction RLS profiles

## Stack technique

- **Framework** : Next.js 16 (App Router)
- **Base de données** : Supabase (PostgreSQL)
- **UI** : Tailwind CSS + shadcn/ui
- **État** : Zustand
- **Validation** : Zod

## Conventions

- Toujours utiliser les Server Actions pour les mutations
- Les hooks personnalisés sont dans `src/hooks/`
- Les types de base de données sont dans `src/types/database.types.ts`

## Structure des pages Admin

```
/admin                  - Dashboard
/admin/pos              - Point de vente (caisse)
/admin/kitchen          - Vue cuisine (commandes à préparer)
/admin/orders           - Liste des commandes
/admin/tables           - Gestion des tables et QR codes
/admin/stock            - Dashboard stock
/admin/stock/items      - Articles en stock (boissons/desserts)
/admin/stock/ingredients- Ingrédients cuisine
/admin/stock/recipes    - Recettes (coût des plats)
/admin/stock/requests   - Demandes d'ingrédients
/admin/menu             - Gestion du menu
/admin/reports          - Rapports et statistiques
/admin/gallery          - Galerie photos
/admin/reviews          - Avis clients
/admin/users            - Gestion des utilisateurs
/admin/settings         - Paramètres du restaurant
```

## Rôles utilisateurs

- **super_admin** : Accès complet, peut créer des admins
- **admin** : Gestion complète sauf création d'admins
- **cashier** : POS, commandes, tables, paiements
- **chef** : Cuisine, commandes, demandes d'ingrédients
- **customer** : Client (pas d'accès admin)

## Données de test (Seed)

- 1 admin (Admin La Teranga)
- 8 catégories de menu
- 51 items de menu
- 15 ingrédients
- 10 articles de stock
- 7 tables de restaurant
- Paramètres du restaurant configurés
