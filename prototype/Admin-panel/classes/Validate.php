<?php
// validates user input by comparing against set rules
class Validate{
    private $_passed = false,
            $_errors = array(),
            $_db = null;

    // run of the mill constructor
    public function __construct(){
        $this->_db = DB::getInstance();
    }

    // checks whether each rule has been satisfied
    public function check($source, $items = array()){
        foreach($items as $item => $rules){
            foreach($rules as $rule => $rule_value){

                $value = trim($source[$item]);
                $item = escape($item);

                if($rule == 'required' && empty($value)){
                    $this->addError($item, "{$item} is required");
                }else if(!empty($value)){
                    switch($rule){
                        // rule - forces a min length
                        case 'min':
                            if(strlen($value) < $rule_value){
                                $this->addError($item, "{$item} must be a minimum of {$rule_value} characters.");
                            }
                            break;
                        // rule - forces a max length
                        case 'max':
                            if(strlen($value) > $rule_value){
                                $this->addError($item, "{$item} must be a maximum of {$rule_value} characters.");
                            }
                            break;
                        // rule - makes sure that an input item matches a specified other
                        // (e.g. password and confirm_password)
                        case 'matches':
                            if($value != $source[$rule_value]){
                                $this->addError($item, "{$rule_value} must match {$item}.");
                            }
                            break;
                        // rule - makes sure the input value does not already exist in the database
                        case 'unique':
                            $check = $this->_db->get($rule_value, array($item, '=', $value));
                            if ($check->count()){
                                $this->addError($item, "{$item} already exists.");
                            }
                            break;
                        // rule - forces a set format for phone numbers
                        case 'checkphone':
                            if(!preg_match('/^\D*0(\D*\d){9}\D*$/', $value)){
                                $this->addError($item, "Phone number is not in the correct format.");
                            }
                            break;
                    }
                }

            }
        }

        if(empty($this->_errors)){
            $this->_passed = true;
        }

        return $this;
    }

    // adds an error to the instance's error list
    private function addError($fieldname, $error){
        $this->_errors[$fieldname] = $error;
    }

    public function errors(){
        return $this->_errors;
    }

    public function passed(){
        return $this->_passed;
    }
}
