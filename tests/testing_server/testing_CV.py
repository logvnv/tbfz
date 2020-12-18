import unittest
from dialog_queue import Queue
from dialog import Dialog

class TestQueueCV_empty(unittest.TestCase):
    test_queue = Queue()
    def test_CV_n(self):
        self.assertEqual(self.test_queue.conversation(5, "нет"), False, "Should be work")
        
class TestQueueCV(unittest.TestCase):
    test_queue = Queue()
    def test_CV_n(self):
        X = Dialog(123, 123, 5, 1)
        self.test_queue.dialogs.append(X)
        self.assertEqual(self.test_queue.conversation(123, "нет"), True, "Should be work")
        
if __name__ == '__main__':
    unittest.main()
