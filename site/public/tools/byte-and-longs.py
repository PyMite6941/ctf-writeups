from Crypto.Util.number import bytes_to_long as crypto_b2l, long_to_bytes as crypto_l2b

def bytes_to_long(a):
    try:
        a = a.encode() if isinstance(a, str) else a
        return crypto_b2l(b"" + a)
    except Exception as e:
        return f"Error: {e}"

def long_to_bytes(n):
    try:
        return crypto_l2b(n)
    except Exception as e:
        return f"Error: {e}"

if __name__ == "__main__":
    choice = input("Enter 'b2l' to convert bytes to long or 'l2b' to convert long to bytes: ").strip().lower()
    if choice == 'b2l':
        byte_input = input("Enter text: ").strip()
        byte_data = byte_input.encode()
        long_output = bytes_to_long(byte_data)
        print(f"Long representation: {long_output}")
    elif choice == 'l2b':
        long_input = int(input("Enter long integer: ").strip())
        byte_output = long_to_bytes(long_input)
        print(f"Bytes representation: {byte_output}")