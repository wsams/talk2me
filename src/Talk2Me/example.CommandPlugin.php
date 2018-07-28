<?php
namespace Talk2Me;

class CommandPlugin {

    public function execute($chat, $from, $json, $t) {
        if (preg_match("/\/samplecommand/", $json->msg)) {
            $o = array("status"=>"ok", "a"=>"message", "t"=>$t,
                    "msg"=>"Executing sample command");
            $from->send(json_encode($o));
            return true;
        }
        return false;
    }

}
