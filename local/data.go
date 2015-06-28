package main

import (
	"bytes"
	"gopkg.in/yaml.v2"
	"io/ioutil"
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

type cfgbody struct {
	COD    string
	Tag    string
	Index  int
	Author string
	Cfg    string
	Sig    string
}

var COD = "xuemen"

func postlog() {
	newlog := logbody{"", "testtag", "huangyg", "bodybody", "sig"}
	body, _ := yaml.Marshal(&newlog)
	newlog.Log = string(body)
	body, _ = yaml.Marshal(&newlog)

	resp, err := http.Post("http://127.0.0.1:46372/data", "application/yaml", bytes.NewReader(body))
	defer resp.Body.Close()
	if err == nil {
		rbody, _ := ioutil.ReadAll(resp.Body)
		log.Print(string(rbody))
	}
}

func putcfg() {
	newcfg := cfgbody{"egonet", "testtag", -1, "huangyg", "cfgbody", "sig"}
	body, _ := yaml.Marshal(&newcfg)
	newcfg.Cfg = string(body)
	body, _ = yaml.Marshal(&newcfg)

	req, err := http.NewRequest("PUT", "http://127.0.0.1:46372/data", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/yaml")

	var c http.Client
	resp, err := c.Do(req)

	defer resp.Body.Close()
	if err == nil {
		rbody, _ := ioutil.ReadAll(resp.Body)
		log.Print(string(rbody))
	}
}
