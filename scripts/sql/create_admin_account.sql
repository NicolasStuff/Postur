-- Bootstrap a Postur admin account.
--
-- Default credentials created by this script:
--   email: nicolas.ivorra.ni@gmail.com
--   password: PosturAdmin!2026
--
-- Change the values in the "input" CTE before running if needed.
-- To generate a new Better Auth compatible password hash:
-- node -e "import('better-auth/crypto').then(async m => console.log(await m.hashPassword('YOUR_PASSWORD_HERE')))"

BEGIN;

WITH input AS (
  SELECT
    'nicolas.ivorra.ni@gmail.com'::text AS email,
    'Nicolas Ivorra'::text AS name,
    '6336099f4d3b42446dab8bd64b75ffa7:b2f3a8d9cabf895538b68afb109e4f70f637d812b7db0670e72fa010c01f3698375b03546f7501af6e0fb428b1dfb988ca2addbc6969f5bce57cccb6c635e1c3'::text AS password_hash,
    NOW()::timestamp AS ts
),
resolved_ids AS (
  SELECT
    email,
    name,
    password_hash,
    ts,
    'admin_user_' || SUBSTRING(MD5(email), 1, 24) AS user_id,
    'admin_account_' || SUBSTRING(MD5(email), 1, 24) AS account_row_id
  FROM input
),
upserted_user AS (
  INSERT INTO "User" (
    id,
    email,
    name,
    "emailVerified",
    image,
    "createdAt",
    "updatedAt",
    role,
    slug,
    "practitionerType",
    siret,
    "companyName",
    "companyAddress",
    "isVatExempt",
    "defaultVatRate",
    "openingHours",
    "slotDuration",
    language
  )
  SELECT
    user_id,
    email,
    name,
    TRUE,
    NULL,
    ts,
    ts,
    'ADMIN'::"Role",
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    TRUE,
    NULL,
    NULL,
    60,
    'fr'
  FROM resolved_ids
  ON CONFLICT (email) DO UPDATE
  SET
    name = EXCLUDED.name,
    "emailVerified" = TRUE,
    role = 'ADMIN'::"Role",
    "updatedAt" = EXCLUDED."updatedAt"
  RETURNING id, email
),
updated_credential_account AS (
  UPDATE "Account" AS account
  SET
    "accountId" = user_row.id,
    "providerId" = 'credential',
    password = ids.password_hash,
    "updatedAt" = ids.ts
  FROM upserted_user AS user_row
  CROSS JOIN resolved_ids AS ids
  WHERE account."userId" = user_row.id
    AND account."providerId" = 'credential'
  RETURNING account.id
),
inserted_credential_account AS (
  INSERT INTO "Account" (
    id,
    "userId",
    "accountId",
    "providerId",
    "accessToken",
    "refreshToken",
    "accessTokenExpiresAt",
    "refreshTokenExpiresAt",
    scope,
    password,
    "createdAt",
    "updatedAt",
    "idToken"
  )
  SELECT
    ids.account_row_id,
    user_row.id,
    user_row.id,
    'credential',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    ids.password_hash,
    ids.ts,
    ids.ts,
    NULL
  FROM upserted_user AS user_row
  CROSS JOIN resolved_ids AS ids
  WHERE NOT EXISTS (
    SELECT 1 FROM updated_credential_account
  )
  RETURNING id
)
SELECT
  user_row.id AS admin_user_id,
  user_row.email AS admin_email,
  'ADMIN'::text AS role,
  CASE
    WHEN EXISTS (SELECT 1 FROM updated_credential_account) THEN 'updated'
    WHEN EXISTS (SELECT 1 FROM inserted_credential_account) THEN 'created'
    ELSE 'unchanged'
  END AS credential_account_status
FROM upserted_user AS user_row;

COMMIT;
