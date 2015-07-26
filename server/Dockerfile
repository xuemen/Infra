
FROM google/nodejs

MAINTAINER Huang Yonggang <fromoon@gmail.com>

RUN curl https://raw.githubusercontent.com/xuemen/Infra/master/server/Infra.data.js > Infra.data.js
ENTRYPOINT node Infra.data.js

EXPOSE 46372