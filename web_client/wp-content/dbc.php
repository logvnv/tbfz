<?php
$link = mysqli_connect("127.0.0.1", "root", "", "tbfz");

if (!$link) {
    echo "Ошибка: Невозможно установить соединение с MySQL." . PHP_EOL;
    echo "Код ошибки errno: " . mysqli_connect_errno() . PHP_EOL;
    echo "Текст ошибки error: " . mysqli_connect_error() . PHP_EOL;
    exit;
}

//$machine = 1;
$machine = $_POST['currentMachine'];

// Attempt select query execution
$sql = "SELECT failure_cause.`category`, count(failure.failure_cause_id)
		FROM failure_cause, failure 
		WHERE failure.`failure_cause_id` = failure_cause.`failure_cause_id` AND failure.`machine_id` =".$machine." 
		group by failure_cause.`category`";

$labelsN = array();
$dataN = array();
if($result = mysqli_query($link, $sql)){
	if(mysqli_num_rows($result) > 0){      
		$i = 0;
		while($row = mysqli_fetch_array($result)){
			$labelsN[$i] = $row[0];
			$dataN[$i] = $row[1];
			$i++;
		}
		
		echo (implode(',',$labelsN));
		echo '|';
		echo (implode(',',$dataN));
		//$updated_data = json_encode($dataN);
		//$updated_labels = json_encode($labelsN);
		
		// Free result set
		mysqli_free_result($result);
	} else{
		echo "No records matching your query were found.";
	}
} else{
	echo "ERROR: Could not able to execute $sql. " . mysqli_error($link);
}
	// Close connection
	mysqli_close($link);?>
