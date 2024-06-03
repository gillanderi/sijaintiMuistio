import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('locations.db');

const alustaTietokanta = () => {
  db.transaction(tx => {
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS sijainnit (id INTEGER PRIMARY KEY NOT NULL, nimi TEXT, kuvaus TEXT, leveysaste REAL, pituusaste REAL, pvm TEXT);',
      [],
      () => console.log('Tietokanta luotiin onnistuneesti'),
      (_, err) => {
        console.log('Tietokannan luonti epäonnistui', err);
        return false; 
      }
    );
    tx.executeSql(
      'CREATE TABLE IF NOT EXISTS kuvat (id INTEGER PRIMARY KEY NOT NULL, sijaintiId INTEGER, kuvaUri TEXT, FOREIGN KEY (sijaintiId) REFERENCES sijainnit (id) ON DELETE CASCADE);',
      [],
      () => console.log('Kuvat-taulukko luotiin onnistuneesti'),
      (_, err) => {
        console.log('Kuvat-taulukon luonti epäonnistui', err);
        return false;
      }
    );
  });
};
  

const lisaaSijainti = (nimi: string, kuvaus: string, leveysaste: number, pituusaste: number, pvm: string, callback: (onnistui: boolean, tulos?: any, virhe?: any) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO sijainnit (nimi, kuvaus, leveysaste, pituusaste, pvm) VALUES (?, ?, ?, ?, ?);',
      [nimi, kuvaus, leveysaste, pituusaste, pvm],
      (_, result) => callback(true, result),
      (_, err) => {
        callback(false, undefined, err);
        return false; 
      }
    );
  });
};
const poistaSijainti = (id: number, callback: (onnistui: boolean, virhe?: any) => void) => {
  db.transaction(tx => {
    
    tx.executeSql(
      'DELETE FROM kuvat WHERE sijaintiId = ?;',
      [id],
      
      (_, result) => {
        tx.executeSql(
          'DELETE FROM sijainnit WHERE id = ?;',
          [id],
          (_, result) => {
            console.log("Sijainti ja siihen liittyvät kuvat poistettu ");
            callback(true, null);
          },
          (_, err) => {
            console.error("Sijainnin poisto epäonnistui:", err);
            callback(false, err);
            return false; 
          }
        );
      },
      (_, err) => {
        console.error("Kuvien poisto epäonnistui:", err);
        callback(false, err);
        return false; 
      }
    );
  });
};


const haeSijainnit = (callback: (onnistui: boolean, sijainnit?: any[], virhe?: any) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM sijainnit;',
      [],
      (_, { rows: { _array } }) => callback(true, _array),
      (_, err) => {
        callback(false, undefined, err);
        return false;
      }
    );
  });
};
const lisaaKuva = (sijaintiId: number, kuvaUri: string, callback: (onnistui: boolean, tulos?: any, virhe?: any) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'INSERT INTO kuvat (sijaintiId, kuvaUri) VALUES (?, ?);',
      [sijaintiId, kuvaUri],
      (_, result) => callback(true, result),
      (_, err) => {
        callback(false, undefined, err);
        return false;
      }
    );
  });
};

const haeKuvat = (sijaintiId: number, callback: (onnistui: boolean, kuvat?: any[], virhe?: any) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM kuvat WHERE sijaintiId = ?;',
      [sijaintiId],
      (_, { rows: { _array } }) => callback(true, _array),
      (_, err) => {
        callback(false, undefined, err);
        return false;
      }
    );
  });
};
const poistaKuva = (kuvaId: number, callback: (onnistui: boolean, virhe?: any) => void) => {
  db.transaction(tx => {
    tx.executeSql(
      'DELETE FROM kuvat WHERE id = ?;',
      [kuvaId],
      (_, result) => {
        callback(true, null); 
        return true; 
      },
      (_, err) => {
        callback(false, err); 
        return false; 
      }
    );
  });
};

export { alustaTietokanta, lisaaSijainti, haeSijainnit, lisaaKuva, haeKuvat,poistaKuva, poistaSijainti};
