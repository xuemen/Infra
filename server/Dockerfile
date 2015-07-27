
FROM google/nodejs

MAINTAINER Huang Yonggang <fromoon@gmail.com>

RUN npm install infraserver
WORKDIR node_modules\infraserver

EXPOSE 46372

CMD ["node", "Infra.data.js"]