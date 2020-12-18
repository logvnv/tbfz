import unittest
from sensor import Sensor

class TestSensor(unittest.TestCase):
    def test_message(self):
        test_sensor = Sensor()
        test_sensor.id = 5
        test_sensor.switch()
        self.assertEqual(test_sensor.testing_str, "Станок №5 остановлен.", "Should be work")

    def test_message_n(self):
        test_sensor = Sensor()
        test_sensor.id = 5
        test_sensor.is_running = False
        test_sensor.switch()
        self.assertEqual(test_sensor.testing_str, "Станок №5 запущен.", "Should be work")
        
    def test_id(self):
        test_sensor = Sensor()
        test_sensor.id = 5
        test_sensor.switch()
        self.assertEqual(test_sensor.testing_id, 'i5', "Should be i1")
    
    def test_id_n(self):
        test_sensor = Sensor()
        test_sensor.id = 5
        test_sensor.is_running = False
        test_sensor.switch()
        self.assertEqual(test_sensor.testing_id, 'a5', "Should be a0")

if __name__ == '__main__':
    unittest.main()
