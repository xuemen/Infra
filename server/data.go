package main

import (
	"bytes"
	"fmt"
	"gopkg.in/yaml.v2"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
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

var LogIdx map[string]int
var CfgIdx map[string]time.Time

func indexinit() {
	LogIdx = make(map[string]int)
	indexbyte, _ := ioutil.ReadFile("log/index.yaml")
	yaml.Unmarshal(indexbyte, &LogIdx)
	log.Print(LogIdx)

	CfgIdx = make(map[string]time.Time)
	indexbyte, _ = ioutil.ReadFile("cfg/index.yaml")
	yaml.Unmarshal(indexbyte, &CfgIdx)
	log.Print(CfgIdx)
}

func receive(w http.ResponseWriter, r *http.Request) {
	r.ParseForm() //解析参数，默认是不会解析的
	fmt.Println("method", r.Method)
	fmt.Println("path", r.URL.Path)

	for k, v := range r.Form {
		fmt.Println("key:", k)
		fmt.Println("val:", strings.Join(v, ""))
	}

	if r.Method == "POST" {
		var buf bytes.Buffer
		var body logbody
		buf.ReadFrom(r.Body)
		yaml.Unmarshal(buf.Bytes(), &body)
		//log.Print(body)
		//log.Print(buf.String())
		_, ok := LogIdx[body.Tag]
		if !ok {
			LogIdx[body.Tag] = 0

			fmt.Fprintf(w, "log notify: create a new tag [%s].", body.Tag)
			log.Printf("log notify: create a new tag [%s].", body.Tag)
		}

		var filename string
		if len(body.COD) == 0 {
			filename = fmt.Sprintf("log/%s.%s.%d.yaml", body.Tag, body.Author, LogIdx[body.Tag]+1)
		} else {
			filename = fmt.Sprintf("log/%s.%s.%s.%d.yaml", body.COD, body.Tag, body.Author, LogIdx[body.Tag]+1)
		}

		if Exist(filename) {
			fmt.Fprintf(w, "log fail: file [%s] exist.", filename)
			log.Printf("log fail: file [%s] exist.", filename)
		} else {
			ioutil.WriteFile(filename, buf.Bytes(), 0644)

			LogIdx[body.Tag] = LogIdx[body.Tag] + 1
			d, _ := yaml.Marshal(&LogIdx)
			ioutil.WriteFile("log/index.yaml", d, 0644)

			fmt.Fprintf(w, "log saved: file [%s].", filename)
			log.Printf("log saved: file [%s].", filename)
		}
	} else if r.Method == "PUT" {
		var buf bytes.Buffer
		var body cfgbody
		buf.ReadFrom(r.Body)
		yaml.Unmarshal(buf.Bytes(), &body)
		//log.Print(body)
		//log.Print(buf.String())
		var filename string
		if len(body.COD) == 0 {
			filename = fmt.Sprintf("cfg/%s.%s", body.Tag, body.Author)
		} else {
			filename = fmt.Sprintf("cfg/%s.%s.%s", body.COD, body.Tag, body.Author)
		}
		if body.Index == -1 {
			filename = fmt.Sprintf("%s.yaml", filename)
		} else {
			filename = fmt.Sprintf("%s.%d.yaml", filename, body.Index)
		}

		if Exist(filename) {
			fmt.Fprintf(w, "cfg notify: file [%s] recover.", filename)
			log.Printf("cfg notify: file [%s] recover.", filename)
		} else {
			fmt.Fprintf(w, "cfg notify: create file [%s].", filename)
			log.Printf("cfg notify: create file [%s].", filename)
		}
		ioutil.WriteFile(filename, buf.Bytes(), 0644)

		CfgIdx[filename] = time.Now() //.Format("2006-01-02 15:04:05")
		d, _ := yaml.Marshal(&CfgIdx)
		ioutil.WriteFile("cfg/index.yaml", d, 0644)
	}
}

func Exist(filename string) bool {
	_, err := os.Stat(filename)
	return err == nil || os.IsExist(err)
}
