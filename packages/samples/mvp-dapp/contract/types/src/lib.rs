#![cfg_attr(not(feature = "std"), no_std)]
#[cfg(not(feature = "std"))]
extern crate alloc;
extern crate no_std_compat as std;


pub mod generated;
pub mod kuai_mvp_data;

#[cfg(test)]
mod tests {
    use alloc::string::String;
    use alloc::vec::Vec;
    use super::*;
    use crate::kuai_mvp_data::{Data, KuaiMvpView};

    #[test]
    fn it_works() {
        let mut address_vec: Vec<Data> = Vec::new();

        address_vec.push(Data {
            key: String::from("123"),
            value: String::from("123"),
        });
        address_vec.push(Data {
            key: String::from("1234"),
            value: String::from("1234"),
        });
        address_vec.push(Data {
            key: String::from("12345"),
            value: String::from("12345"),
        });

        let x = KuaiMvpView {
            addresses: address_vec,
        };

        // println!("{:?}", x.as_molecule_data());
        let x1 = x.as_molecule_data().unwrap();

        let result = KuaiMvpView::new(x1.as_ref());

    }
}
