async function checkHealth(fc) {
  try {
    await fc.id();
  } catch (err) {
    throw new Error(
      "Error: couldn't connect to your filecoin node; please make sure your filecoin daemon is running and that your address is correct"
    );
  }
}

module.exports = {
  checkHealth
};
