// Loads live content from the backend into the public homepage.
document.addEventListener('DOMContentLoaded', async function () {
  if (typeof Api === 'undefined') return;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };

  try {
    const content = await Api.getContent();
    setText('js-hero-eyebrow', content.heroEyebrow);
    setText('js-hero-title', content.heroTitle);
    setText('js-hero-lede', content.heroLede);
    setText('js-mission-text', content.missionText);
    setText('js-stat-students', content.statStudents);
    setText('js-stat-faculty', content.statFaculty);
    setText('js-stat-departments', content.statDepartments);
    setText('js-stat-library', content.statLibrary);
  } catch (e) {
    console.warn('Could not load site content from backend — showing defaults.', e);
  }

  try {
    const notices = await Api.getNotices(5);
    const newsList = document.getElementById('js-news-list');
    if (newsList && notices.length) {
      newsList.innerHTML = notices.map(function (n) {
        const date = new Date(n.published_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        return '<li><a href="#">' + n.title + '</a><span class="news-date">' + date + '</span></li>';
      }).join('');
    }
  } catch (e) {
    console.warn('Could not load notices from backend — showing defaults.', e);
  }
});
