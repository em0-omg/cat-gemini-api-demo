// API Endpoint
const API_ENDPOINT = 'https://cat-gemini-api-demo.em0818-omg.workers.dev/api/diagnosis';

// DOM Elements
const form = document.getElementById('diagnosis-form');
const submitBtn = document.getElementById('submit-btn');
const btnText = submitBtn.querySelector('.btn-text');
const btnLoading = submitBtn.querySelector('.btn-loading');
const resultSection = document.getElementById('result');
const resultContent = document.getElementById('result-content');

// Toggle visibility handlers
const dislikedFoodRadios = document.querySelectorAll('input[name="dislikedFoodStatus"]');
const dislikedFoodDetails = document.getElementById('disliked-food-details');
const healthIssueRadios = document.querySelectorAll('input[name="hasHealthIssues"]');
const healthConcernsDetails = document.getElementById('health-concerns-details');

// Event: Toggle disliked food details
dislikedFoodRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'ある' && radio.checked) {
      dislikedFoodDetails.classList.remove('hidden');
    } else if (radio.checked) {
      dislikedFoodDetails.classList.add('hidden');
    }
  });
});

// Event: Toggle health concerns details
healthIssueRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'true' && radio.checked) {
      healthConcernsDetails.classList.remove('hidden');
    } else if (radio.checked) {
      healthConcernsDetails.classList.add('hidden');
    }
  });
});

// Form submit handler
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Set loading state
  setLoading(true);
  resultSection.classList.add('hidden');

  try {
    const catInfo = buildCatInfoFromForm();

    // デバッグ: 送信データをコンソールに出力
    console.log('[DEBUG] Sending request to:', API_ENDPOINT);
    console.log('[DEBUG] Request body:', JSON.stringify({ cat: catInfo }, null, 2));

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cat: catInfo }),
    });

    console.log('[DEBUG] Response status:', response.status);
    console.log('[DEBUG] Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[DEBUG] Error response body:', errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }

      // エラーの詳細を表示
      const errorMessage = errorData.details
        ? `${errorData.message} (${errorData.details})`
        : errorData.message || `エラーが発生しました (${response.status})`;

      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('[DEBUG] Success response:', data);

    renderResult(data);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });

  } catch (error) {
    console.error('[DEBUG] Error:', error);
    renderError(error.message);
    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth' });
  } finally {
    setLoading(false);
  }
});

/**
 * Set loading state
 */
function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  if (isLoading) {
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
  } else {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
  }
}

/**
 * Build CatInfo object from form data
 */
function buildCatInfoFromForm() {
  const formData = new FormData(form);

  // Build dislikedFood object
  const dislikedFoodStatus = formData.get('dislikedFoodStatus');
  const dislikedFood = {
    status: dislikedFoodStatus,
  };
  if (dislikedFoodStatus === 'ある') {
    const details = formData.getAll('dislikedFoodDetail');
    if (details.length > 0) {
      dislikedFood.details = details;
    }
  }

  // Build healthConcerns object
  const hasHealthIssues = formData.get('hasHealthIssues') === 'true';
  const healthConcerns = {
    hasIssues: hasHealthIssues,
  };
  if (hasHealthIssues) {
    const concerns = formData.getAll('healthConcern');
    if (concerns.length > 0) {
      healthConcerns.concerns = concerns;
    }
  }

  return {
    name: formData.get('name'),
    gender: formData.get('gender'),
    neutered: formData.get('neutered') === 'on',
    age: parseInt(formData.get('age'), 10),
    breed: formData.get('breed'),
    bodyType: formData.get('bodyType'),
    weight: parseFloat(formData.get('weight')),
    activityLevel: formData.get('activityLevel'),
    mainFood: formData.get('mainFood'),
    treats: formData.get('treats'),
    favoriteFood: formData.get('favoriteFood'),
    dislikedFood,
    healthConcerns,
  };
}

/**
 * Render successful result
 */
function renderResult(data) {
  const recommendationsHtml = data.recommendations
    .map(rec => `
      <div class="product-card">
        <h3>${escapeHtml(rec.name)}</h3>
        <p class="category">${escapeHtml(rec.category)} / ${escapeHtml(rec.series)}</p>
        <p class="reason">${escapeHtml(rec.reason)}</p>
        <ul class="features">
          ${rec.features.map(f => `<li>${escapeHtml(f)}</li>`).join('')}
        </ul>
      </div>
    `)
    .join('');

  resultContent.innerHTML = `
    <div class="summary">${escapeHtml(data.summary)}</div>
    <div class="recommendations">${recommendationsHtml}</div>
    <p class="notes">${escapeHtml(data.notes)}</p>
    <p class="generated-at">生成日時: ${formatDate(data.generatedAt)}</p>
  `;
}

/**
 * Render error message
 */
function renderError(message) {
  resultContent.innerHTML = `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
      <p>しばらく待ってから再度お試しください。</p>
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  const escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return String(str).replace(/[&<>"']/g, (m) => escapeMap[m]);
}

/**
 * Format ISO date string to localized string
 */
function formatDate(isoString) {
  try {
    return new Date(isoString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
