<?php
/* Class to handle database interaction and abstracts PDO usage */
class DB{
    private static $_instance = null;
    private $_pdo, // pdo object
            $_query, // last executed query
            $_error = false, // whether query failed or not
            $_results, // result set
            $_count = 0; // number of results

    // creates PDO object based on global db variables (see init.php)
    private function __construct(){
        try{
            $this->_pdo = new PDO('mysql:host=' . Config::get('mysql/host') . ';dbname=' . Config::get('mysql/db'),
                Config::get('mysql/username'),
                Config::get('mysql/password'));
        }catch(PDOException $e){
            die($e->getMessage());
        }
    }

    // returns an instance of the class (creates one if none exist)
    public static function getInstance(){
        if(!isset(self::$_instance)){
            self::$_instance = new DB();
        }
        return self::$_instance;
    }

    // creates PDO query
    public function query($sql, $params = array()){
        $this->_error = false;
        if($this->_query = $this->_pdo->prepare($sql)){
            $x = 1;
            if(count($params)){
                foreach($params as $param){
                    $this->_query->bindValue($x, $param);
                    $x++;
                }
            }
            if($this->_query->execute()){
                $this->_results = $this->_query->fetchAll(PDO::FETCH_OBJ);
                $this->_count = $this->_query->rowCOunt();
            } else{
                $this->_error = true;
            }
        }
        return $this;
    }

    // performs a specified action on the db
    // $where format example: array('name', '=', 'Liam')
    public function action($action, $table, $where = array()){
        if(count($where) == 3){
            $operators = array('=', '>', '<', '>=', '<=', '<>');

            $field = $where[0];
            $operator = $where[1];
            $value = $where[2];

            if(in_array($operator, $operators)){
                $sql = "{$action} FROM {$table} WHERE {$field} {$operator} ?";
                if(!$this->query($sql, array($value))->error()){
                    return $this;
                }
            }
        }
        return false;
    }

    // gets all entries from a table subject to a where argument
    public function get($table, $where){
        return $this->action('SELECT *', $table, $where);
    }

    // selects specified field from all entries in a table
    public function select($field, $table){
        return $this->action("SELECT {$field}", $table, array("{$field}", '<>', ' '));
    }

    // deletes an entry from a table
    public function delete($table, $where){
        return $this->action('DELETE', $table, $where);
    }

    // inserts a new entry into a table
    public function insert($table, $fields = array()){
        $keys = array_keys($fields);
        $values = null;
        $x = 1;

        // puts a comma after each field that is not the last
        foreach($fields as $field){
            $values .= '?';
            if($x < count($fields)){
                $values .= ', ';
            }
            $x++;
        }

        // prepares SQL statement
        $sql = "INSERT INTO {$table} (`" . implode('`, `', $keys) . "`) VALUES ({$values})";

        // returns boolean representing success of prepared query
        if(!$this->query($sql, $fields)->error()){
            return true;
        }
        return false;
    }

    // Updates certain fields of a specified table entry
    public function update($table, $id, $idVal, $fields){
        $set = '';
        $x = 1;

        // puts a comma after each field that is not the last
        foreach($fields as $field => $value){
            $set .= "{$field} = ?";
            if($x < count($fields)){
                $set .= ', ';
            }
            $x++;
        }

        // prepares SQL statement
        $sql = "UPDATE {$table} SET {$set} WHERE {$id} = {$idVal}";

        // returns boolean representing success of prepared query
        if(!$this->query($sql, $fields)->error()){
            return true;
        }
        return false;
    }

    // gets result set
    public function results(){
        return $this->_results;
    }

    // gets first entry from result set
    public function first(){
        return $this->results()[0];
    }

    // gets error status (boolean value)
    public function error(){
        return $this->_error;
    }

    // returns number of results in current result set
    public function count(){
        return $this->_count;
    }
}
