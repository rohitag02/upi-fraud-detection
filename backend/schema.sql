-- UPI Fraud Detection Platform — PostgreSQL Schema
-- Run this once to set up your database

CREATE TABLE IF NOT EXISTS transactions (
  id              VARCHAR(30)     PRIMARY KEY,
  upi_id          VARCHAR(100)    NOT NULL,
  sender_name     VARCHAR(100),
  amount          DECIMAL(12, 2)  NOT NULL,
  note            TEXT,
  risk_score      INTEGER         NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  decision        VARCHAR(10)     NOT NULL CHECK (decision IN ('APPROVED', 'REVIEW', 'BLOCKED')),
  confidence      VARCHAR(10)     NOT NULL CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')),
  reasons         JSONB           DEFAULT '[]',
  scored_by       VARCHAR(20)     DEFAULT 'rule-engine',
  reviewed        BOOLEAN         DEFAULT FALSE,
  review_decision VARCHAR(10),
  review_note     TEXT,
  created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Indexes for fast queries on hot paths
CREATE INDEX IF NOT EXISTS idx_transactions_upi_id    ON transactions(upi_id);
CREATE INDEX IF NOT EXISTS idx_transactions_decision  ON transactions(decision);
CREATE INDEX IF NOT EXISTS idx_transactions_created   ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reviewed  ON transactions(reviewed) WHERE reviewed = FALSE;

-- Stats view used by /api/transactions/stats
CREATE OR REPLACE VIEW transaction_stats AS
SELECT
  COUNT(*)                                          AS total,
  COUNT(*) FILTER (WHERE decision = 'APPROVED')     AS approved,
  COUNT(*) FILTER (WHERE decision = 'REVIEW')       AS review,
  COUNT(*) FILTER (WHERE decision = 'BLOCKED')      AS blocked,
  ROUND(
    COUNT(*) FILTER (WHERE decision = 'BLOCKED')
    * 100.0 / NULLIF(COUNT(*), 0), 1
  ) || '%'                                          AS fraud_rate
FROM transactions;
