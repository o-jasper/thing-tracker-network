
default: validate_node_schema

node_modules/: #NOTE will contact the internet
	npm install schema schema-validator
node_modules: node_modules/

#Validates the example.
validate_node_schema:  #(no files, should aways run)
	sh validate.sh ../../specification/schema.json ../example-tracker.json
