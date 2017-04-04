<?php
// An object class used to represent a user
class User{
    public $_db,
            $_data,
            $_sessionName,
            $_isLoggedIn;

    public  function __construct($user = null){
        $this->_db = DB::getInstance();
        $this->_sessionName = Config::get('session/session_name'); // so we don't need to call config::get every time

        if(!$user){
            if(Session::exists($this->_sessionName)){
                $user = Session::get($this->_sessionName);

                //check if user actually exists
                if($this->find($user)){
                    $this->_isLoggedIn = true;
                }else{
                    // process logout
                }
            }
        }else{
            $this->find($user);
        }
    }

    // creates a user entry within the database
    public function create($fields = array()){
        if(!$this->_db->insert('users', $fields)){
            throw new Exception('There was a problem creating your account.');
        }
    }
	
	// updates a user entry within the database by id
    public function update($fields = array(), $idVal){
        if(!$this->_db->update('users', 'id', $idVal, $fields)){
            throw new Exception('There was a problem updating your details.');
        }
    }

    // updates the users password within the database
    public function newPassword($fields = array(), $id, $idVal){
        if(!$this->_db->update('users', $id, $idVal, $fields)){
            throw new Exception('There was a problem creating your new password.');
        }
    }

    // finds a user entry within the database with a given id or email
    public function find($user = null){
        if($user){
            $field = (is_numeric($user)) ? 'id' : 'email';
            $data = $this->_db->get('users', array($field, '=', $user));

            // checks if the user does exists
            if($data->count()){
                $this->_data = $data->first();
                return true;
            }
        }
        return false;
    }

    // handles the login of the user
    public function login($email = null, $password = null){
        $user = $this->find($email);

        if($user){
            if($this->data()->password === Hash::make($password, $this->data()->salt)){
                Session::put($this->_sessionName, $this->data()->id);
                return true;
            }
        }
        return false;
    }

    public function logout(){
        Session::delete($this->_sessionName);
    }

    // accesses all fields of the user's database entry
    public function data(){
        return $this->_data;
    }

    // checks whether the user is currently logged in
    public function isLoggedIn(){
        return $this->_isLoggedIn;
    }
}
