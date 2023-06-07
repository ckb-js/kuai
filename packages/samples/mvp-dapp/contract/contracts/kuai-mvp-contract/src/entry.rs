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
    ckb_types::{bytes::Bytes, prelude::*},
};

use crate::error::Error;
use core::str;
use serde::{Deserialize, Serialize};

extern crate alloc;
use alloc::string::{String, ToString};
use types::kuai_mvp_data::KuaiMvpView;

pub fn main() -> Result<(), Error> {
    // remove below examples and write your code here

    let script = load_script()?;
    let args: Bytes = script.args().unpack();
    debug!("script args is {:?}", args);

    let data = load_cell_data(0, Source::Output).map_err(|_| Error::DataParseError)?;
    debug!("data is {:?}", data.clone());

    let jsonStr = str::from_utf8(&data[8..data.len()]).map_err(|_| Error::DataParseError)?;
    debug!("jsonStr is {:?}", jsonStr);
    let view = KuaiMvpView::as_json_str(jsonStr);
    debug!("data is {:?}", view);


    // return an error if args is invalid
    if !view.verify() {
        return Err(Error::CkbAddressEmptyError);
    }

    let tx_hash = load_tx_hash()?;
    debug!("tx hash is {:?}", tx_hash);

    let _buf: Vec<_> = vec![0u8; 32];

    Ok(())
}


