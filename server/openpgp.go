package main

import (
	"fmt"
	"golang.org/x/crypto/openpgp"
	"golang.org/x/crypto/openpgp/armor"
	"os"
	"time"
)

func getKeyByFingerprint(keyring openpgp.EntityList, Fingerprint [20]byte) *openpgp.Entity {
	for _, entity := range keyring {
		if entity.PrimaryKey.Fingerprint == Fingerprint {
			return entity
		}
	}

	return nil
}

func getKeyByEmail(keyring openpgp.EntityList, email string) *openpgp.Entity {
	for _, entity := range keyring {
		for _, ident := range entity.Identities {
			if ident.UserId.Email == email {
				return entity
			}
		}
	}

	return nil
}

func ReadJSKey() {
	pubringFile, _ := os.Open("path to public keyring")
	defer pubringFile.Close()
	pubring, _ := openpgp.ReadArmoredKeyRing(pubringFile)
	theirPublicKey := getKeyByEmail(pubring, "huangyg@xuemen.com")

	secringFile, _ := os.Open("path to private keyring")
	defer secringFile.Close()
	secring, _ := openpgp.ReadArmoredKeyRing(secringFile)
	myPrivateKey := getKeyByEmail(secring, "huangyg@xuemen.com")

	myPrivateKey.PrivateKey.Decrypt([]byte("passphrase"))

	var hint openpgp.FileHints
	hint.IsBinary = false
	hint.FileName = "_CONSOLE"
	hint.ModTime = time.Now()

	w, _ := armor.Encode(os.Stdout, "PGP MESSAGE", nil)
	defer w.Close()
	plaintext, _ := openpgp.Encrypt(w, []*openpgp.Entity{theirPublicKey}, myPrivateKey, &hint, nil)
	defer plaintext.Close()

	fmt.Fprintf(plaintext, "黄勇刚在熟悉OpenPGP代码\n")
}
