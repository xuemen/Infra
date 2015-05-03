package main

import (
	"bytes"
	"gopkg.in/yaml.v2"
	"log"
	"net/http"
)

type logbody struct {
	COD    string
	Tag    string
	Author string
	Log    string
	Sig    string
}

var COD = "xuemen"

func sendlog() {
	newlog := logbody{COD, "testtag", "huangyg", "body", "sig"}
	body, _ := yaml.Marshal(&newlog)
	newlog.Log = string(body)
	body, _ = yaml.Marshal(&newlog)

	resp, err := http.Post("http://127.0.0.1:46372/data", "application/yaml", bytes.NewReader(body))
	defer resp.Body.Close()
	if err == nil {
		log.Print(resp.Body)
	}
}
