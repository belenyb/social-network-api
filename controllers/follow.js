const followTest = (req, res) => {
  return res.status(200).send({
    message: "desde controllers/follow.js"
  });
}

module.exports = {
  followTest
}
