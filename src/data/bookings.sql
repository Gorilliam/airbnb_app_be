CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  total_price numeric(10,2),
  created_at timestamptz DEFAULT now()
);


CREATE OR REPLACE FUNCTION calculate_total_price()
RETURNS TRIGGER AS $$
DECLARE
  nights integer;
  price numeric(10,2);
BEGIN
  SELECT price_per_night INTO price FROM properties WHERE id = NEW.property_id;
  nights := (NEW.check_out_date - NEW.check_in_date);
  NEW.total_price := price * nights;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_total_price_trigger ON bookings;

CREATE TRIGGER set_total_price_trigger
BEFORE INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION calculate_total_price();
