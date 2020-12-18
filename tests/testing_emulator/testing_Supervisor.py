import unittest
from supervisor import Supervisor

class TestSupervisor(unittest.TestCase):
    test_switch = Supervisor()
    def test_message(self):
        sensor = self.test_switch.sensors[4]
        self.test_switch.switch(4)
        
        answr = sensor.testing_id
        self.assertEqual(answr, 'i4', "Should be work")
        
    def test_message_n(self):
        sensor = self.test_switch.sensors[3]
        self.test_switch.switch(3)
        self.test_switch.switch(3)
        
        answr = sensor.testing_id
        self.assertEqual(answr, 'a3', "Should be work")

if __name__ == '__main__':
    unittest.main()
