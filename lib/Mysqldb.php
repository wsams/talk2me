<?php
class Mysqldb {
    public $a_result;
    public $q;
    private static $singleton;
    private $mysqlConnection;
    private $mysqlServer;
    private $mysqlPort;
    private $mysqlUsername;
    private $mysqlPassword;
    private $mysqlDatabase;

    public function __construct ($mysqlServer, $mysqlPort, $mysqlUsername, $mysqlPassword, $mysqlDatabase) {
        $this->mysqlServer = $mysqlServer;
        $this->mysqlPort = $mysqlPort;
        $this->mysqlUsername = $mysqlUsername;
        $this->mysqlPassword = $mysqlPassword;
        $this->mysqlDatabase = $mysqlDatabase;
        if (isset($mysqlServer) && isset($mysqlPort) && isset($mysqlUsername) && isset($mysqlPassword)) {
            $this->mysqlConnection = mysql_pconnect("{$mysqlServer}:{$mysqlPort}", $mysqlUsername, $mysqlPassword);
            if (!$this->mysqlConnection) {
                trigger_error("Could not connect to your MySQL server: mysql://{$this->server}:{$this->port}", E_USER_ERROR);
                return false;
            }
            if (!mysql_select_db($mysqlDatabase, $this->mysqlConnection)) {
                trigger_error("Could not connect to your database: {$this->mysqlDatabase}", E_USER_ERROR);
                return false;
            }
            return $this;
        }
        return false;
    }

    /**
     * Given an sql query this function returns an array, where the first index indicates the row number,
     * and points to an associative array where the index is the column name and the value is the column value.
     * @param string $q SQL query
     * @return mixed Return false if a query could not be performed, or $this otherwise.
     */
    public function query ($q) {
        $this->q = $q;
        //mysql_query("SET AUTOCOMMIT=0");
        //mysql_query("START TRANSACTION");
        if (!$this->mysqlConnection || !mysql_query("select 1", $this->mysqlConnection)) {
            $this->reconnect();
        }
        $result = mysql_query($q, $this->mysqlConnection);
        if ($result) {
            //mysql_query("COMMIT");
            if (preg_match("/^\s*select/", $q)) {
                $cnt = 0;
                $a_result = array();
                while ($row = mysql_fetch_assoc($result)) {
                    foreach ($row as $k=>$v) {
                        $a_result[$cnt][$k] = $v;
                    }
                    unset($row);
                    $cnt++;
                }
                return $a_result;
            } else {
                return mysql_insert_id();
            }
        } else {
            //mysql_query("ROLLBACK");
            trigger_error("Could not perform MySQL query: {$q}", E_USER_NOTICE);
            return false;
        }
    }

    public function reconnect() {
        $this->mysqlConnection = mysql_pconnect("{$this->mysqlServer}:{$this->mysqlPort}", $this->mysqlUsername, $this->mysqlPassword);
        if (!$this->mysqlConnection) {
            trigger_error("Could not connect to your MySQL server: mysql://{$this->server}:{$this->port}", E_USER_ERROR);
            return false;
        }
        if (!mysql_select_db($this->mysqlDatabase, $this->mysqlConnection)) {
            trigger_error("Could not connect to your database: {$this->mysqlDatabase}", E_USER_ERROR);
            return false;
        }
        return true;
    }

    /**
     * Returns a MySQL database safe string. (Has been escaped)
     * @param string $str SQL query string
     * @return string The escaped SQL string.
     */
    public function esc ($str) {
        $str = mysql_real_escape_string($str, $this->mysqlConnection);
        return $str;
    }

    public function __destruct () {
        unset($a_result);
    }
}
?>
