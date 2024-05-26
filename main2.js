document.addEventListener("DOMContentLoaded", async () => {
    const loadingElement = document.getElementById('loading');
    const container = document.getElementById('patient-records');
    const totalRecordsElement = document.getElementById('total-records');
    const validRecordsElement = document.getElementById('valid-records');
    const invalidRecordsElement = document.getElementById('invalid-records');
    const invalidRecordsList = document.getElementById('invalid-records-list');

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
        let totalRecords = 0;
        let validRecords = 0;
        let invalidRecords = 0;
        const invalidPatientRecords = [];

        Object.entries(patientGroups).forEach(([masobenhan, services], index) => {
            const { hoten, khoa } = services[0];
            totalRecords++;

            let hasOverlap = false;

            const cardHTML = services.map(service => {
                const { dichvukythuat, thoigianthuchien, thoigianketthuc } = service;
                const isOverlapping = isOverlap(service, services);
                if (isOverlapping) hasOverlap = true;
                return `
                <li class="list-group-item ${isOverlap(service, services) ? 'bg-danger' : 'bg-success'}">
                <p class='list-group-item_'>${dichvukythuat}</p> 
                <p class='list-group-item_'><i class="bi bi-clock"></i> ${moment(thoigianthuchien, "D/M/YYYY h:mm A").format("YYYY-MM-DDTHH:mm:ss")}</p>
                <p class='list-group-item_'><i class="bi bi-clock-history"></i> ${moment(thoigianketthuc, "D/M/YYYY h:mm A").format("YYYY-MM-DDTHH:mm:ss")}</p>
            </li>`;
            }).join('');

            if (hasOverlap) {
                invalidRecords++;
                invalidPatientRecords.push({ masobenhan, hoten, khoa, index });
            } else {
                validRecords++;
            }

            const card = document.createElement('div');
            card.classList.add('card', 'mb-3');
            card.id = `record-${index}`;
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

        // Cập nhật thống kê
        totalRecordsElement.textContent = ` ${totalRecords} hồ sơ`;
        validRecordsElement.textContent = ` ${validRecords} hồ sơ`;
        invalidRecordsElement.textContent = ` ${invalidRecords} hồ sơ`;

        // Hiển thị danh sách bệnh án có dữ liệu trùng
        invalidRecordsList.innerHTML = invalidPatientRecords.map(record => `
            <p>
                <a href="#" class="invalid-record-link" data-index="${record.index}">
                    Hồ sơ: ${record.masobenhan} - ${record.hoten}, Khoa: ${record.khoa}
                </a>
            </p>
        `).join('');

        // Thêm sự kiện nhấp cho các liên kết bệnh án không hợp lệ
        document.querySelectorAll('.invalid-record-link').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const index = this.getAttribute('data-index');
                const recordElement = document.getElementById(`record-${index}`);
                if (recordElement) {
                    recordElement.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Ẩn thanh loading và hiển thị dữ liệu
        loadingElement.style.display = 'none';
        container.style.display = 'block';
    } catch (error) {
        console.error('Error fetching JSON:', error);
        loadingElement.innerHTML = '<p class="text-danger">Lỗi, vui lòng kiểm tra lại đường truyền internet hoặc file trang tính.</p>';
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
