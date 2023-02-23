const publicationTest = (req, res) => {
  return res.status(200).send({
    message: "desde controllers/publication.js"
  });
}

module.exports = {
  publicationTest
}
