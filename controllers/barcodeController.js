exports.lookupBarCode = (req, res) => {
  const code = req.params.code;
  res.send('Looking it up!');
}
