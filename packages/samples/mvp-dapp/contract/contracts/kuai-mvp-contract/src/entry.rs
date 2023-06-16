// Import from `core` instead of from `std` since we are in no-std mode
use core::result::Result;

// Import heap related library from `alloc`
// https://doc.rust-lang.org/alloc/index.html
use alloc::{vec, vec::Vec};

// Import CKB syscalls and structures
// https://docs.rs/ckb-std/
use ckb_std::{
    debug,
    ckb_constants::Source,
    high_level::{load_script, load_tx_hash, load_cell_data},
    ckb_types::{bytes::Bytes},
    high_level::{load_cell, QueryIter},
};

use crate::error::Error;
use core::str;
use serde::{Deserialize, Serialize};

extern crate alloc;
use alloc::string::{String, ToString};
use types::kuai_mvp_data::KuaiMvpView;

pub fn main() -> Result<(), Error> {
    let datas = QueryIter::new(load_cell_data, Source::GroupOutput).collect::<Vec<Vec<u8>>>();
    debug!("{:?}", datas);

    for data in datas {
        if data.is_empty() {
            return Err(Error::NotMvpData)
        }

        let jsonStr = str::from_utf8(&data[8..data.len()]).map_err(|_| Error::DataParseError)?;
        let view = KuaiMvpView::as_json_str(jsonStr);
        if !view.verify() {
            return Err(Error::CkbAddressEmptyError);
        }
    }

    Ok(())
}



