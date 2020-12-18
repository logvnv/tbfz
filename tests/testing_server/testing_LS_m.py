import unittest
from dialog_queue import Queue

class TestQueue(unittest.TestCase):
    test_queue = Queue()
    
    def test_state(self):
        self.test_queue.data = "a0"
        self.test_queue.listen_to_sensors()
        self.test_queue.data = "i1"
        self.test_queue.listen_to_sensors()
        
        self.test_queue.data = "i2"
        self.test_queue.listen_to_sensors()
        
        self.assertEqual(self.test_queue.states, {'0': True, '1':False, '2':False}, "Should be work")
        
if __name__ == '__main__':
    unittest.main()
