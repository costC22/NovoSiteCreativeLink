document.addEventListener('DOMContentLoaded', function() {
    const serviceItems = document.querySelectorAll('.service-item');

    serviceItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transition = 'transform 0.3s, box-shadow 0.3s';
            item.style.transform = 'scale(1.05)';
            item.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'scale(1)';
            item.style.boxShadow = 'none';
        });
    });
});