def ascii_solver(ascii_value:int):
    try:
        ascii_value = int(ascii_value)
        if 0 <= ascii_value <= 127:
            character = chr(ascii_value)
            print(f"The character for ASCII value {ascii_value} is: '{character}'")
        else:
            print("Please enter a valid ASCII value between 0 and 127.")
    except ValueError:
        print("Invalid input. Please enter a numeric ASCII value.")

if __name__ == '__main__':
    ascii_numbers = [99, 114, 121, 112, 116, 111, 123, 65, 83, 67, 73, 73, 95, 112, 114, 49, 110, 116, 52, 98, 108, 51, 125]
    for ascii_value in ascii_numbers:
        ascii_solver(ascii_value)