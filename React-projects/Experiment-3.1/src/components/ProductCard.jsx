function ProductCard({props})
{
    return (
        <div className="product-card">
            <b>{props.name}</b>
            <p>Price: ${props.price}</p>
            
        </div>
    );
}

export default ProductCard;