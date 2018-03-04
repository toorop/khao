package main

import (
	"log"
	"net/http"

	"math/rand"

	"fmt"
	"time"

	"github.com/coreos/bbolt"
	"github.com/labstack/echo"
)

const dbPath = "/var/www/s.khao.io/khao.db"

var DB *bolt.DB

type Cookie struct {
	Name   string
	Value  string
	Domain string
}

/*

Stockage dans bolt
bucket -> domain
subBucket -> cookie name
key -> int
value -> cookie value

*/

// switch cookie
func (c Cookie) Switch() (Cookie, error) {
	var values []string
	err := DB.View(func(tx *bolt.Tx) error {
		// get bucket /domain/name
		bucket := tx.Bucket([]byte(c.Domain))
		if bucket == nil {
			return nil
		}
		bucket = bucket.Bucket([]byte(c.Name))
		if bucket == nil {
			return nil
		}
		cursor := bucket.Cursor()

		// todo find a better way to handle "rand" with bolt
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			//log.Printf("Key: %s, value %s", k, v)
			values = append(values, string(v))
		}
		lv := len(values)
		switch lv {
		case 0:
			log.Printf("nothing found for switching %s from domain %s", c.Name, c.Domain)
		case 1:
			if c.Value != values[0] {
				log.Printf("switching (one2one) %s from domain %s from %s to %s", c.Name, c.Domain, c.Value, values[0])
				c.Value = values[0]
			} else {
				log.Printf("nothing found for switching %s from domain %s", c.Name, c.Domain)
			}

		default:
			var val string
			for {
				val = values[rand.Intn(lv)]
				if c.Value != val {
					c.Value = val
					break
				}
			}
			log.Printf("switching %s from domain %s from %s to %s", c.Name, c.Domain, c.Value, val)
		}
		return nil
	})
	return c, err
}

// Save cookie in DB if it's a new one
func (c *Cookie) Save() error {
	err := DB.Update(func(tx *bolt.Tx) error {
		// cookie exists in DB ?
		bucket, err := tx.CreateBucketIfNotExists([]byte(c.Domain))
		if err != nil {
			log.Printf("unable to create bucket %s: %v", c.Domain, err)
			return err
		}

		bucket, err = bucket.CreateBucketIfNotExists([]byte(c.Name))
		if err != nil {
			log.Printf("unable to create bucket %s: %v", c.Name, err)
			return err
		}

		cursor := bucket.Cursor()
		for k, v := cursor.First(); k != nil; k, v = cursor.Next() {
			if string(v) == c.Value {
				//log.Printf("cookie %s:%s:%s already in BD", c.Domain, c.Name, c.Value)
				return nil
			}
		}
		// if not found
		// there must be collision it's a good compromise:
		// - collision are not a real problem here
		// - generating "real" uuid cost much power/time
		// - timestamp could be useful

		key := []byte(fmt.Sprintf("%d", time.Now().UnixNano()))
		err = bucket.Put(key, []byte(c.Value))
		if err != nil {
			log.Printf("new cookie saved: domain: %s, name: %s, value: %s", c.Domain, c.Name, c.Value)
		}
		return err
	})
	if err != nil {
		log.Printf("unable to save cookie - Domain: %s, Name: %s, Value: %s", c.Domain, c.Name, c.Value)
		return err
	}

	return nil
}

func handlerCookieSwitch(c echo.Context) error {
	cookie := new(Cookie)
	if err := c.Bind(cookie); err != nil {
		log.Printf("unable to bin cookie: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	// switch cookie
	newCookie, err := cookie.Switch()
	if err != nil {
		log.Printf("unable to switch cookie: %v", err)
		return c.NoContent(http.StatusInternalServerError)
	}

	// save cookie
	// use go routine  to reduce latency for client
	go cookie.Save()

	return c.JSON(http.StatusOK, newCookie)
}

func main() {
	var err error
	// init DB
	DB, err = bolt.Open(dbPath, 0600, nil)
	if err != nil {
		log.Fatalf("unable to open DB %s: %v", dbPath, err)
	}

	// init echo
	e := echo.New()
	e.POST("/cookie/switch", handlerCookieSwitch)
	log.Fatalln(e.Start(":3332"))
}
