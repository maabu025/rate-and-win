document.getElementById("feedbackForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const formData = new FormData(this);
  const data = Object.fromEntries(formData.entries());

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      alert("Feedback submitted successfully!");
      window.location.href = "feedback-confirmation.html";
    } else {
      alert("Something went wrong.");
    }
  } catch (error) {
    console.error(error);
    alert("Network error.");
  }
});
