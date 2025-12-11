import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';

type Props = {
    value: string;                // 'HH:mm'
    onChange: (value: string) => void;
};

// Hàm thêm số 0 vào trước nếu là số có một chữ số
const pad = (n: number) => n.toString().padStart(2, '0');

// Phân tích chuỗi thời gian 'HH:mm'
const parseTime = (value: string) => {
    const match = /^(\d{2}):(\d{2})$/.exec(value);
    // Mặc định là 08:00 nếu chuỗi không hợp lệ
    if (!match) return { hour: 8, minute: 0 };
    const h = Math.min(Math.max(Number(match[1]), 0), 23);
    const m = Math.min(Math.max(Number(match[2]), 0), 59);
    return { hour: h, minute: m };
};

const WheelTimePicker: React.FC<Props> = ({ value, onChange }) => {
    const { hour: initialHour, minute: initialMinute } = parseTime(value);

    // State cho chỉ mục giờ và phút
    const [hourIndex, setHourIndex] = useState(initialHour);
    const [minuteIndex, setMinuteIndex] = useState(initialMinute);

    // Dữ liệu cho bộ chọn
    const hours = Array.from({ length: 24 }, (_, i) => pad(i));
    const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

    // Đồng bộ state khi prop value thay đổi (ví dụ: khi chỉnh sửa)
    useEffect(() => {
        const { hour, minute } = parseTime(value);
        setHourIndex(hour);
        setMinuteIndex(minute);
    }, [value]);

    // Emit giá trị đã chọn ra ngoài component
    useEffect(() => {
        onChange(`${hours[hourIndex]}:${minutes[minuteIndex]}`);
    }, [hourIndex, minuteIndex]);

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {/* Cột Giờ */}
                <View style={styles.column}>
                    <Text style={styles.label}>GIỜ</Text>
                    <ScrollPicker
                        dataSource={hours}
                        selectedIndex={hourIndex}
                        renderItem={(data) => (
                            <Text style={styles.itemText}>{data}</Text>
                        )}
                        onValueChange={(_, selectedIndex) => {
                            setHourIndex(selectedIndex);
                        }}
                        wrapperHeight={240} // Đã tăng kích thước
                        wrapperBackground="#FFFFFF" // Nền trắng
                        itemHeight={50} // Đã tăng kích thước
                        highlightColor="#007AFF" // Màu chính
                        highlightBorderWidth={1}
                        highlightStyle={styles.highlightStyle} // Sử dụng highlightStyle để tuỳ chỉnh viền
                        activeItemTextStyle={styles.activeItemText}
                        itemTextStyle={styles.itemText}
                    />
                </View>

                {/* Dấu phân cách */}
                <Text style={styles.separator}>:</Text>

                {/* Cột Phút */}
                <View style={styles.column}>
                    <Text style={styles.label}>PHÚT</Text>
                    <ScrollPicker
                        dataSource={minutes}
                        selectedIndex={minuteIndex}
                        renderItem={(data) => (
                            <Text style={styles.itemText}>{data}</Text>
                        )}
                        onValueChange={(_, selectedIndex) => {
                            setMinuteIndex(selectedIndex);
                        }}
                        wrapperHeight={240} // Đã tăng kích thước
                        wrapperBackground="#FFFFFF" // Nền trắng
                        itemHeight={50} // Đã tăng kích thước
                        highlightColor="#007AFF" // Màu chính
                        highlightBorderWidth={1}
                        highlightStyle={styles.highlightStyle} // Sử dụng highlightStyle để tuỳ chỉnh viền
                        activeItemTextStyle={styles.activeItemText}
                        itemTextStyle={styles.itemText}
                    />
                </View>
            </View>

            {/* Phần Tóm tắt */}
            <View style={styles.summary}>
                <Text style={styles.summaryLabel}>GIỜ NHẮC NHỞ</Text>
                <Text style={styles.summaryValue}>
                    {hours[hourIndex]}:{minutes[minuteIndex]}
                </Text>
            </View>
        </View>
    );
};

export default WheelTimePicker;

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
        paddingVertical: 16,
        backgroundColor: '#FFFFFF', // Nền trắng cho toàn bộ picker
        borderRadius: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    column: {
        alignItems: 'center',
        flex: 1, // Đảm bảo hai cột chiếm không gian đều nhau
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280', // Màu xám đậm hơn một chút
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    separator: {
        marginHorizontal: 16,
        fontSize: 42, // Đã tăng kích thước để cân đối
        fontWeight: '800',
        color: '#1F2937', // Màu tối
    },
    itemText: {
        fontSize: 20, // Đã tăng kích thước
        color: '#9CA3AF', // Màu xám nhạt cho mục không chọn
        fontWeight: '500',
    },
    activeItemText: {
        fontSize: 32, // Đã tăng kích thước cho mục đang chọn
        color: '#007AFF',
        fontWeight: '900',
    },
    highlightStyle: {
        // Tuỳ chỉnh viền highlight để làm cho nó trông như một đường kẻ mỏng
        borderColor: '#D1D5DB', // Màu viền xám nhẹ
        borderWidth: 1,
        borderRadius: 0, // Không bo góc
    },
    summary: {
        marginTop: 24, // Khoảng cách lớn hơn
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F3F4F6', // Nền nhẹ cho phần tóm tắt
        borderRadius: 8,
        width: '80%',
    },
    summaryLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4B5563', // Màu đậm hơn cho nhãn tóm tắt
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 36, // Đã tăng kích thước
        fontWeight: '900',
        color: '#007AFF', // Màu chính
    },
});