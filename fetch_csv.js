async function fetchCSV() {
  const res = await fetch('https://docs.google.com/spreadsheets/d/1ma7ZRlSGmdh4BtPc6Y3blDABpxkqzrDcOhywquliBYw/gviz/tq?tqx=out:csv&sheet=DN');
  const text = await res.text();
  console.log(text.substring(0, 500));
}
fetchCSV();
