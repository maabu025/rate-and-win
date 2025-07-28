const reviewsEndpoint = 'http://localhost:3000/reviews';

function renderReviews(data){
  const container = $('#reviews').empty();
  data.forEach(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5-r.rating);
    const card = $(`
      <div class="review-card d-flex align-items-center">
        <img src="${r.userAvatar}" alt="${r.userName}">
        <div class="ml-3">
          <h5>${r.userName} <small class="text-muted">${r.timeAgo}</small></h5>
          <p><strong>${r.restaurantName}</strong> <span class="stars">${stars}</span></p>
          <p>${r.comment}</p>
        </div>
      </div>`);
    container.append(card);
  });
}

function loadReviews(){
  $.ajax({
    url: reviewsEndpoint,
    method: 'GET',
    success: renderReviews,
    error: () => alert('Unable to load reviews.')
  });
}

$('#search').on('input', function(){
  const q = this.value.toLowerCase();
  $.ajax({
    url: `${reviewsEndpoint}?restaurantName_like=${q}`,
    method: 'GET',
    success: renderReviews
  });
});

$(document).ready(loadReviews);
