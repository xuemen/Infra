package main

import (
	"bytes"
	"fmt"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/clearsign"
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

		var key string
		if len(body.COD) == 0 {
			key = fmt.Sprintf("%s.%s", body.Tag, body.Author)
		} else {
			key = fmt.Sprintf("%s.%s", body.COD, body.Tag)
		}
		_, ok := LogIdx[key]
		if !ok {
			LogIdx[key] = 0

			fmt.Fprintf(w, "log notify: create a new key [%s].\n", key)
			log.Printf("log notify: create a new key [%s].\n", key)
		}

		var filename string
		if len(body.COD) == 0 {
			filename = fmt.Sprintf("log/%s.%s.%d.yaml", body.Tag, body.Author, LogIdx[key]+1)
		} else {
			filename = fmt.Sprintf("log/%s.%s.%s.%d.yaml", body.COD, body.Tag, body.Author, LogIdx[key]+1)
		}

		if Exist(filename) {
			fmt.Fprintf(w, "log fail: file [%s] exist.", filename)
			log.Printf("log fail: file [%s] exist.", filename)
		} else {
			ioutil.WriteFile(filename, buf.Bytes(), 0644)

			LogIdx[key] = LogIdx[key] + 1
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

type Log struct {
	Data     string
	Hashtype int
	Hash     string
	Sigtype  int
	Sig      string
}

func CheckSignedLog(logfile, pubkey string) {
	var l logbody
	file, _ := ioutil.ReadFile(logfile)
	yaml.Unmarshal(file, &l)
	var body Log
	yaml.Unmarshal([]byte(l.Log), &body)
	//log.Print(body.Sig)

	b, _ := clearsign.Decode([]byte(body.Sig))
	log.Print(b)
	log.Print(b.Headers)
	log.Print(string(b.Plaintext))
	log.Print(string(b.Bytes))
	log.Print(b.ArmoredSignature)

	pubringFile, _ := os.Open(pubkey)
	defer pubringFile.Close()
	pubring, _ := openpgp.ReadArmoredKeyRing(pubringFile)
	//theirPublicKey := getKeyByEmail(pubring, "huangyg@xuemen.com")
	//log.Print(theirPublicKey)

	key, err := openpgp.CheckDetachedSignature(pubring, bytes.NewReader(b.Bytes), b.ArmoredSignature.Body)
	log.Print(key)
	log.Print(err)
}
