import https from 'https';
import fs from 'fs';

https.get('https://docs.google.com/spreadsheets/d/1ma7ZRlSGmdh4BtPc6Y3blDABpxkqzrDcOhywquliBYw/export?format=csv&gid=48627314', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('/app/applet/csv_output.csv', data);
    console.log('Done');
  });
});
