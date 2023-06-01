#![cfg_attr(not(feature = "std"), no_std)]
#[cfg(not(feature = "std"))]

extern crate no_std_compat as std;

use crate::generated::basic::{MString};
use crate::generated::mvp_data::{KuaiMvpData, KuaiMvpDataReader, Obj, Objs};
use molecule::{
    bytes::Bytes,
    error::VerificationError,
    prelude::{Builder, Entity},
};
use molecule::prelude::Reader;

use serde_json;
use serde::{Deserialize, Serialize};

extern crate alloc;
use alloc::string::String;
use alloc::vec::Vec;

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Data {
    pub key: String,
    pub value: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct KuaiMvpView {
    pub addresses: Vec<Data>,
}

impl Data {
    pub fn as_molecule_data(&self) -> Obj {
        let key = MString::new_unchecked(Bytes::from(self.key.as_bytes().to_vec()));
        let value = MString::new_unchecked(Bytes::from(self.value.as_bytes().to_vec()));

        Obj::new_builder().key(key).value(value).build()
    }
}

impl KuaiMvpView {
    pub fn new(data: &[u8]) -> Result<KuaiMvpView, VerificationError> {
        let data_reader = KuaiMvpDataReader::new_unchecked(data);
        let objs = data_reader.addresses().to_entity();
        let mut addresses = Vec::new();
        for i in 0..objs.item_count() {
            let key = objs.get(i).unwrap().key();
            let value = objs.get(i).unwrap().value();
            addresses.push(Data{
                key: String::from_utf8(key.as_slice().to_vec()).unwrap(),
                value: String::from_utf8(value.as_slice().to_vec()).unwrap(),
            })
        }

        return Ok(KuaiMvpView{ addresses })

    }

    pub fn as_molecule_data(&self) -> Result<Bytes, VerificationError> {
        let mut objs_build = Objs::new_builder();

        for data in self.addresses.iter() {
            objs_build = objs_build.push(data.as_molecule_data());
        }

        let objs = objs_build.build();

        Ok(KuaiMvpData::new_builder().addresses(objs).build().as_bytes())
    }

    pub fn as_json_str(data: &str) -> KuaiMvpView {
        let view: KuaiMvpView = serde_json::from_str(data).unwrap();
        view
    }

    pub fn verify(&self) {
        if self.addresses.len() == 0 {
            panic!("address cannot be empty");
        }

        if self.addresses.get(0).unwrap().key != "ckb" {
            panic!("the first of the addresses must be ckb");
        }
    }
}
