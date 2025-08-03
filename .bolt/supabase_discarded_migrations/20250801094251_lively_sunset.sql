@@ .. @@
$$ LANGUAGE plpgsql;
+
+-- Create trigger for relay number generation
+CREATE TRIGGER generate_relay_number_trigger
+  BEFORE INSERT ON relays
+  FOR EACH ROW
+  EXECUTE FUNCTION generate_relay_number();