// Generated by Molecule 0.7.3

use molecule::prelude::*;
#[derive(Clone)]
pub struct MString(molecule::bytes::Bytes);
impl ::core::fmt::LowerHex for MString {
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        use molecule::hex_string;
        if f.alternate() {
            write!(f, "0x")?;
        }
        write!(f, "{}", hex_string(self.as_slice()))
    }
}
impl ::core::fmt::Debug for MString {
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        write!(f, "{}({:#x})", Self::NAME, self)
    }
}
impl ::core::fmt::Display for MString {
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        use molecule::hex_string;
        let raw_data = hex_string(&self.raw_data());
        write!(f, "{}(0x{})", Self::NAME, raw_data)
    }
}
impl ::core::default::Default for MString {
    fn default() -> Self {
        let v: Vec<u8> = vec![0, 0, 0, 0];
        MString::new_unchecked(v.into())
    }
}
impl MString {
    pub const ITEM_SIZE: usize = 1;
    pub fn total_size(&self) -> usize {
        molecule::NUMBER_SIZE + Self::ITEM_SIZE * self.item_count()
    }
    pub fn item_count(&self) -> usize {
        molecule::unpack_number(self.as_slice()) as usize
    }
    pub fn len(&self) -> usize {
        self.item_count()
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn get(&self, idx: usize) -> Option<Byte> {
        if idx >= self.len() {
            None
        } else {
            Some(self.get_unchecked(idx))
        }
    }
    pub fn get_unchecked(&self, idx: usize) -> Byte {
        let start = molecule::NUMBER_SIZE + Self::ITEM_SIZE * idx;
        let end = start + Self::ITEM_SIZE;
        Byte::new_unchecked(self.0.slice(start..end))
    }
    pub fn raw_data(&self) -> molecule::bytes::Bytes {
        self.0.slice(molecule::NUMBER_SIZE..)
    }
    pub fn as_reader<'r>(&'r self) -> MStringReader<'r> {
        MStringReader::new_unchecked(self.as_slice())
    }
}
impl molecule::prelude::Entity for MString {
    type Builder = MStringBuilder;
    const NAME: &'static str = "MString";
    fn new_unchecked(data: molecule::bytes::Bytes) -> Self {
        MString(data)
    }
    fn as_bytes(&self) -> molecule::bytes::Bytes {
        self.0.clone()
    }
    fn as_slice(&self) -> &[u8] {
        &self.0[..]
    }
    fn from_slice(slice: &[u8]) -> molecule::error::VerificationResult<Self> {
        MStringReader::from_slice(slice).map(|reader| reader.to_entity())
    }
    fn from_compatible_slice(slice: &[u8]) -> molecule::error::VerificationResult<Self> {
        MStringReader::from_compatible_slice(slice).map(|reader| reader.to_entity())
    }
    fn new_builder() -> Self::Builder {
        ::core::default::Default::default()
    }
    fn as_builder(self) -> Self::Builder {
        Self::new_builder().extend(self.into_iter())
    }
}
#[derive(Clone, Copy)]
pub struct MStringReader<'r>(&'r [u8]);
impl<'r> ::core::fmt::LowerHex for MStringReader<'r> {
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        use molecule::hex_string;
        if f.alternate() {
            write!(f, "0x")?;
        }
        write!(f, "{}", hex_string(self.as_slice()))
    }
}
impl<'r> ::core::fmt::Debug for MStringReader<'r> {
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        write!(f, "{}({:#x})", Self::NAME, self)
    }
}
impl<'r> ::core::fmt::Display for MStringReader<'r> {
    fn fmt(&self, f: &mut ::core::fmt::Formatter) -> ::core::fmt::Result {
        use molecule::hex_string;
        let raw_data = hex_string(&self.raw_data());
        write!(f, "{}(0x{})", Self::NAME, raw_data)
    }
}
impl<'r> MStringReader<'r> {
    pub const ITEM_SIZE: usize = 1;
    pub fn total_size(&self) -> usize {
        molecule::NUMBER_SIZE + Self::ITEM_SIZE * self.item_count()
    }
    pub fn item_count(&self) -> usize {
        molecule::unpack_number(self.as_slice()) as usize
    }
    pub fn len(&self) -> usize {
        self.item_count()
    }
    pub fn is_empty(&self) -> bool {
        self.len() == 0
    }
    pub fn get(&self, idx: usize) -> Option<ByteReader<'r>> {
        if idx >= self.len() {
            None
        } else {
            Some(self.get_unchecked(idx))
        }
    }
    pub fn get_unchecked(&self, idx: usize) -> ByteReader<'r> {
        let start = molecule::NUMBER_SIZE + Self::ITEM_SIZE * idx;
        let end = start + Self::ITEM_SIZE;
        ByteReader::new_unchecked(&self.as_slice()[start..end])
    }
    pub fn raw_data(&self) -> &'r [u8] {
        &self.as_slice()[molecule::NUMBER_SIZE..]
    }
}
impl<'r> molecule::prelude::Reader<'r> for MStringReader<'r> {
    type Entity = MString;
    const NAME: &'static str = "MStringReader";
    fn to_entity(&self) -> Self::Entity {
        Self::Entity::new_unchecked(self.as_slice().to_owned().into())
    }
    fn new_unchecked(slice: &'r [u8]) -> Self {
        MStringReader(slice)
    }
    fn as_slice(&self) -> &'r [u8] {
        self.0
    }
    fn verify(slice: &[u8], _compatible: bool) -> molecule::error::VerificationResult<()> {
        use molecule::verification_error as ve;
        let slice_len = slice.len();
        if slice_len < molecule::NUMBER_SIZE {
            return ve!(Self, HeaderIsBroken, molecule::NUMBER_SIZE, slice_len);
        }
        let item_count = molecule::unpack_number(slice) as usize;
        if item_count == 0 {
            if slice_len != molecule::NUMBER_SIZE {
                return ve!(Self, TotalSizeNotMatch, molecule::NUMBER_SIZE, slice_len);
            }
            return Ok(());
        }
        let total_size = molecule::NUMBER_SIZE + Self::ITEM_SIZE * item_count;
        if slice_len != total_size {
            return ve!(Self, TotalSizeNotMatch, total_size, slice_len);
        }
        Ok(())
    }
}
#[derive(Debug, Default)]
pub struct MStringBuilder(pub(crate) Vec<Byte>);
impl MStringBuilder {
    pub const ITEM_SIZE: usize = 1;
    pub fn set(mut self, v: Vec<Byte>) -> Self {
        self.0 = v;
        self
    }
    pub fn push(mut self, v: Byte) -> Self {
        self.0.push(v);
        self
    }
    pub fn extend<T: ::core::iter::IntoIterator<Item = Byte>>(mut self, iter: T) -> Self {
        for elem in iter {
            self.0.push(elem);
        }
        self
    }
    pub fn replace(&mut self, index: usize, v: Byte) -> Option<Byte> {
        self.0
            .get_mut(index)
            .map(|item| ::core::mem::replace(item, v))
    }
}
impl molecule::prelude::Builder for MStringBuilder {
    type Entity = MString;
    const NAME: &'static str = "MStringBuilder";
    fn expected_length(&self) -> usize {
        molecule::NUMBER_SIZE + Self::ITEM_SIZE * self.0.len()
    }
    fn write<W: molecule::io::Write>(&self, writer: &mut W) -> molecule::io::Result<()> {
        writer.write_all(&molecule::pack_number(self.0.len() as molecule::Number))?;
        for inner in &self.0[..] {
            writer.write_all(inner.as_slice())?;
        }
        Ok(())
    }
    fn build(&self) -> Self::Entity {
        let mut inner = Vec::with_capacity(self.expected_length());
        self.write(&mut inner)
            .unwrap_or_else(|_| panic!("{} build should be ok", Self::NAME));
        MString::new_unchecked(inner.into())
    }
}
pub struct MStringIterator(MString, usize, usize);
impl ::core::iter::Iterator for MStringIterator {
    type Item = Byte;
    fn next(&mut self) -> Option<Self::Item> {
        if self.1 >= self.2 {
            None
        } else {
            let ret = self.0.get_unchecked(self.1);
            self.1 += 1;
            Some(ret)
        }
    }
}
impl ::core::iter::ExactSizeIterator for MStringIterator {
    fn len(&self) -> usize {
        self.2 - self.1
    }
}
impl ::core::iter::IntoIterator for MString {
    type Item = Byte;
    type IntoIter = MStringIterator;
    fn into_iter(self) -> Self::IntoIter {
        let len = self.len();
        MStringIterator(self, 0, len)
    }
}