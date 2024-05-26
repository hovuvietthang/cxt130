document.addEventListener("DOMContentLoaded", async () => {
    const loadingElement = document.getElementById('loading');
    const container = document.getElementById('patient-records');

    // Hiển thị thanh loading
    loadingElement.style.display = 'block';
    container.style.display = 'none';

    // Kiểm tra xem Moment.js đã được tải trước đó hay chưa
    if (typeof moment === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/momentjs/latest/moment.min.js';
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve); // Chờ Moment.js tải xong
    }

    try {
        const response = await fetch('https://script.googleusercontent.com/macros/echo?user_content_key=PSyj883hZJVqT_8tA9QcxXLGD5PlpKkP6QN5iEJtVLauDYXQkO0QyxV3uy8UtQRs-t9nDqcxEEet6Fl3q-JyOuC5tjMyE4Cim5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnHEKYQScMb2ehDxvUP5GMtJkuEEI_aw3YJMT7IlTozvb3kGEsXpiRRO2c5SHH21m9EhQBS-vn87NJWQljW3T_UhSCSmli7AIS9z9Jw9Md8uu&lib=MkviNWy1FtEE_2wnDr2JkUuL-BsLZbOvR');
        const data = await response.json();

        const patientGroups = {};
        data.forEach(item => {
            const { masobenhan } = item;
            if (!patientGroups[masobenhan]) patientGroups[masobenhan] = [];
            patientGroups[masobenhan].push(item);
        });

        const fragment = document.createDocumentFragment();

        Object.entries(patientGroups).forEach(([masobenhan, services]) => {
            const { hoten, khoa } = services[0];

            const cardHTML = services.map(service => {
                const { dichvukythuat, thoigianthuchien, thoigianketthuc } = service;
                return `
                    <li class="list-group-item ${isOverlap(service, services) ? 'bg-danger' : 'bg-success'}">
                        <p class='list-group-item_'>${dichvukythuat}</p> 
                        <p class='list-group-item_'><strong>Bắt đầu: </strong> ${moment(thoigianthuchien, "D/M/YYYY h:mm A").format("YYYY-MM-DDTHH:mm:ss")}</p>
                        <p class='list-group-item_'><strong>Kết thúc: </strong> ${moment(thoigianketthuc, "D/M/YYYY h:mm A").format("YYYY-MM-DDTHH:mm:ss")}</p>
                    </li>`;
            }).join('');

            const card = document.createElement('div');
            card.classList.add('card', 'mb-3');
            card.innerHTML = `
                <div class="card-header">
                    <h5 class="card-title">Mã số bệnh án: ${masobenhan}</h5>
                    <p class="card-text">Họ tên: ${hoten}</p>
                    <p class="card-text">Khoa: ${khoa}</p>
                </div>
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">Dịch vụ kỹ thuật</h6>
                    <ul class="list-group">
                        ${cardHTML}
                    </ul>
                </div>`;

            fragment.appendChild(card);
        });

        container.appendChild(fragment);

        // Ẩn thanh loading và hiển thị dữ liệu
        loadingElement.style.display = 'none';
        container.style.display = 'block';
    } catch (error) {
        console.error('Error fetching JSON:', error);
        loadingElement.innerHTML = '<p class="text-danger">Lỗi, vui lòng kiểm tra lại dữ liệu trang tính hoặc đường truyền mạng</p>';
    }
});

function isOverlap(service, services) {
    const startTime = moment(service.thoigianthuchien, "D/M/YYYY h:mm A").valueOf();
    const endTime = moment(service.thoigianketthuc, "D/M/YYYY h:mm A").valueOf();

    for (const otherService of services) {
        if (otherService !== service) {
            const otherStartTime = moment(otherService.thoigianthuchien, "D/M/YYYY h:mm A").valueOf();
            const otherEndTime = moment(otherService.thoigianketthuc, "D/M/YYYY h:mm A").valueOf();

            if (!(endTime <= otherStartTime || startTime >= otherEndTime)) {
                return true;
            }
        }
    }
    return false;
}
