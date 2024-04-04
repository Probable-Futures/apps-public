#!/usr/bin/env bash

# This script is for automating the installation on Linux of RDS SSL Certs into Docker Containers
# via https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.SSL-certificate-rotation.html#UsingWithRDS.SSL-certificate-rotation-sample-script.linux
mydir=tmp/certs
if [ ! -e "${mydir}" ]; then
	mkdir -p "${mydir}"
fi

truststore=${mydir}/rds-truststore.jks
storepassword="${TRUSTSTORE_PASSWORD}"

curl -sS "https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem" >${mydir}/rds-combined-ca-bundle.pem
awk 'split_after == 1 {n++;split_after=0} /-----END CERTIFICATE-----/ {split_after=1}{print > "rds-ca-" n ".pem"}' <${mydir}/rds-combined-ca-bundle.pem

for CERT in rds-ca-*; do
	alias=$(openssl x509 -noout -text -in $CERT | perl -ne 'next unless /Subject:/; s/.*(CN=|CN = )//; print')
	echo "Importing $alias"
	keytool -import -file ${CERT} -alias "${alias}" -storepass ${storepassword} -keystore ${truststore} -noprompt
	rm $CERT
done

rm ${mydir}/rds-combined-ca-bundle.pem

echo "Trust store content is: "

keytool -list -v -keystore "$truststore" -storepass ${storepassword} | grep Alias | cut -d " " -f3- | while read alias; do
	expiry=$(keytool -list -v -keystore "$truststore" -storepass ${storepassword} -alias "${alias}" | grep Valid | perl -ne 'if(/until: (.*?)\n/) { print "$1\n"; }')
	echo " Certificate ${alias} expires in '$expiry'"
done
