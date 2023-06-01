SCHEMA_PATH := schemas
SCHEMA_DEST_PATH := src/generated

schema:
	moleculec --language rust --schema-file ${SCHEMA_PATH}/basic.mol > ${SCHEMA_DEST_PATH}/basic.rs
	moleculec --language rust --schema-file ${SCHEMA_PATH}/mvp_data.mol > ${SCHEMA_DEST_PATH}/mvp_data.rs
	cargo fmt
