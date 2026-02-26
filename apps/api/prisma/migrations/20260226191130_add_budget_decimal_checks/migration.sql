-- Add check constraints for decimal precision on budget tables

ALTER TABLE "BudgetLineItem"
ADD CONSTRAINT "check_subtotal_precision"
CHECK ("subtotal" >= 0 AND "subtotal" <= 999999999999.99);

ALTER TABLE "BudgetResponse"
ADD CONSTRAINT "check_total_precision"
CHECK ("totalAmount" >= 0 AND "totalAmount" <= 999999999999.99);
