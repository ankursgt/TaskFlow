# sorting.py


def insertion_sort(records, key):
    for i in range(1, len(records)):
        current_record = records[i]
        current_value = current_record[key]
        j = i - 1
        while (
            j >= 0
            and records[j][key] > current_value
        ):
            records[j + 1] = records[j]
            j -= 1
        records[j + 1] = current_record