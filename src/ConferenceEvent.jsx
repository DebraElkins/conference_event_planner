
import { useState } from "react";
import "./ConferenceEvent.css";

//load TotalCost function - which calculates and displays event planning cost
//aggregates venue, A/V add-on's and meals, then displays result
import TotalCost from "./TotalCost";

// import 3 slices and associated reducer functions to manage & update global state vars 
import { incrementQuantity, decrementQuantity } from "./venueSlice";
import { toggleMealSelection } from "./mealsSlice";
import { incrementAvQuantity, decrementAvQuantity } from "./avSlice";

// load REACT REDUX functions needed
import { useSelector, useDispatch } from "react-redux";

// define main Conference Event planning component
const ConferenceEvent = () => {

    /*Define vars to manage Component state */
    const [showItems, setShowItems] = useState(false);
    const [numberOfPeople, setNumberOfPeople] = useState(1);

    //initialize state vars for slices for venue, A/V equipment and meals
    // use useSelector hook to read from store, subscribe to state.slice as an object
    //if this object changes, component will automatically re-render
    const venueItems = useSelector((state) => state.venue);
    const avItems = useSelector((state) => state.av);
    const mealsItems = useSelector((state) => state.meals);

    //setup dispatch hook, which sends action object to run reducer and update state
    // call also triggers UI re-rendering if needed
    const dispatch = useDispatch();

    //set remainingAuditoriumQuantity = 3 - inital reservation amount (0)
    // since venue has limited space of 3 auditorium halls
    const remainingAuditoriumQuantity = 3 - venueItems.find(item => item.name === "Auditorium Hall (Capacity:200)").quantity;

    /*Define an event handling function to handle Toggled Items */
    const handleToggleItems = () => {
        console.log("handleToggleItems called");
        setShowItems(!showItems);
    };

    /*Define an event handling function to handle adding items to cart for venue reservations*/
    // includes special handling to not overbook Auditorium Hall (only 3 available)
    // dispatch sends action to Redux store, Redux store matches action to reducer, and performs state update
    const handleAddToCart = (index) => {
        if (venueItems[index].name === "Auditorium Hall (Capacity:200)" && venueItems[index].quantity >= 3) {
          return; 
        }
        dispatch(incrementQuantity(index));
      };
    
    /*Define an event handling function to handle removing items to cart for venue reservations*/
    // dispatch sends action to Redux store, Redux store matches action to reducer, and performs state update
    const handleRemoveFromCart = (index) => {
      if (venueItems[index].quantity > 0) {
        dispatch(decrementQuantity(index));
      }
    };
 
    // Define an event handling function to handle increasing A/V Add-On Items in the cart
    const handleIncrementAvQuantity = (index) => {
      dispatch(incrementAvQuantity(index));
    };

    // Define an event handling function to handle reducing A/V Add-On Items in the cart
    const handleDecrementAvQuantity = (index) => {
      dispatch(decrementAvQuantity(index));
    };

    /*define a function to handle meal selection and pricing per meal for number of people specified*/
    const handleMealSelection = (index) => {
      const item = mealsItems[index];
      if (item.selected && item.type === "mealForPeople") {
        // Ensure numberOfPeople is set before toggling selection
        const newNumberOfPeople = item.selected ? numberOfPeople : 0;
        dispatch(toggleMealSelection(index, newNumberOfPeople));
      }
      else {
        dispatch(toggleMealSelection(index));
      }
    };

    //define a function to get selected items from total cost
    const getItemsFromTotalCost = () => {
        const items = [];
        venueItems.forEach((item) => {
          if (item.quantity > 0) {
            items.push({ ...item, type: "venue" });
          }
        });
        avItems.forEach((item) => {
          if (
            item.quantity > 0 &&
            !items.some((i) => i.name === item.name && i.type === "av")
          ) {
            items.push({ ...item, type: "av" });
          }
        });
        mealsItems.forEach((item) => {
          if (item.selected) {
            const itemForDisplay = { ...item, type: "meals" };
            if (item.numberOfPeople) {
              itemForDisplay.numberOfPeople = numberOfPeople;
            }
            items.push(itemForDisplay);
          }
        });
      return items;
    };

    // holds returned array for venue, av, and meals items
    const items = getItemsFromTotalCost();

    // define function to display items as popup window summary
    const ItemsDisplay = ({ items }) => {
      console.log(items);
      return <>
        <div className="display_box1">
          {items.length === 0 && <p>No items selected</p>}
              <table className="table_item_data">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit Cost</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index}>
                  <td>{item.name}</td>
                  <td>${item.cost}</td>
                  <td>
                    {item.type === "meals" || item.numberOfPeople
                    ? ` For ${numberOfPeople} people`
                    : item.quantity}
                  </td>
                  <td>{item.type === "meals" || item.numberOfPeople
                    ? `${item.cost * numberOfPeople}`
                    : `${item.cost * item.quantity}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    };

    /*Define a function to calculate total cost for cart using slices (venue, A/V, meals) and items selected*/
    const calculateTotalCost = (section) => {
        let totalCost = 0;
        if (section === "venue") {
          venueItems.forEach((item) => {
            totalCost += item.cost * item.quantity;
          });
        }
        else if (section === "av") {
          avItems.forEach((item) => {
            totalCost += item.cost * item.quantity;
          });
        }
        else if (section === "meals") {
          mealsItems.forEach((item) => {
          if (item.selected) {
            totalCost += item.cost * numberOfPeople;
          }
          });
        }

        return totalCost;
    };
    
    //call functions to calculate total costs by slice
    const venueTotalCost = calculateTotalCost("venue");
    const avTotalCost = calculateTotalCost("av");
    const mealsTotalCost = calculateTotalCost("meals");

    //controls display for "Show Details" button 
    // toggle for separate display summary window with itemized cost breakout details
    const navigateToProducts = (idType) => {
      if (idType == '#venue' || idType == '#addons' || idType == '#meals') {
        if (showItems) { // Check if showItems is false
          setShowItems(!showItems); // Toggle showItems to true only if it's currently false
          }
      }
    }

  //define total costs object with names of slices and subtotals
  const totalCosts = {
    venue: venueTotalCost,
    av: avTotalCost,
    meals: mealsTotalCost,
  };


  /* Landing Web Page Setup*/
  return ( <>
    {/*Web Page Navigation Bar Config*/}
    <navbar className="navbar_event_conference">
      <div className="company_logo">Conference Expense Planner</div>
      <div className="left_navbar">
        <div className="nav_links">
          <a href="#venue" onClick={() => navigateToProducts("#venue")} >Venue</a>
          <a href="#addons" onClick={() => navigateToProducts('#addons')}>Add-ons</a>
          <a href="#meals" onClick={() => navigateToProducts('#meals')}>Meals</a>
        </div>
        <button className="details_button" onClick={() => setShowItems(!showItems)}>Show Details</button>
      </div>
    </navbar>

    {/*Web Page Sections Config - by Slice: Venue, A/V Add-Ons, Meals*/}
    <div className="main_container">

      {/*
      Setup Venue Planning Details Part of Page 
      Shows each venue item, cost per item, and button controls to add/remove items
      */}
      {!showItems ?
        ( <div className="items-information">
            <div id="venue" className="venue_container container_main">
              <div className="text"><h1>Venue Room Selection</h1></div>
              <div className="venue_selection">
              {venueItems.map((item, index) => (
              <div className="venue_main" key={index}>
              <div className="img"><img src={item.img} alt={item.name}/></div>
              <div className="text">{item.name}</div>
              <div>${item.cost}</div>
              <div className="button_container">
              {venueItems[index].name === "Auditorium Hall (Capacity:200)" ? (
                <>
                <button
                  className={venueItems[index].quantity === 0 ? "btn-warning btn-disabled" : "btn-minus btn-warning"}
                  onClick={() => handleRemoveFromCart(index)}
                >&#8211;</button>
                <span className="selected_count">
                  {venueItems[index].quantity > 0 ? ` ${venueItems[index].quantity}` : "0"}
                </span>
                <button
                  className={remainingAuditoriumQuantity === 0? "btn-success btn-disabled" : "btn-success btn-plus"}
                  onClick={() => handleAddToCart(index)}
                >&#43;</button>
                </>
              ) 
        : 
        (
          <div className="button_container">
          <button
            className={venueItems[index].quantity ===0 ? " btn-warning btn-disabled" : "btn-warning btn-plus"}
            onClick={() => handleRemoveFromCart(index)}
          >&#8211;</button>
          <span className="selected_count">
            {venueItems[index].quantity > 0 ? ` ${venueItems[index].quantity}` : "0"}
          </span>
          <button
            className={venueItems[index].quantity === 10 ? " btn-success btn-disabled" : "btn-success btn-plus"}
            onClick={() => handleAddToCart(index)}
          >&#43;</button>
          </div>
        )}

          </div>
        </div>
      ))}
    </div>
    <div className="total_cost">Total Cost: ${venueTotalCost}</div>
  </div>

      {/*
      Setup A/V Planning Details Part of Page 
      Shows each A/V addon item, cost per item, and button controls to add/remove items
      */}
      <div id="addons" className="venue_container container_main">
        <div className="text"><h1> Add-ons Selection</h1></div>
        <div className="addons_selection">
          {avItems.map((item, index) => (
            <div className="av_data venue_main" key={index}>
              <div className="img">
              <img src={item.img} alt={item.name} />
              </div>
              <div className="text"> {item.name} </div>
              <div> ${item.cost} </div>
              <div className="addons_btn">
                <button className="btn-warning" onClick={() => handleDecrementAvQuantity(index)}> &ndash; </button>
                <span className="quantity-value">{item.quantity}</span>
                <button className=" btn-success" onClick={() => handleIncrementAvQuantity(index)}> &#43; </button>
              </div>
            </div>
          ))}
        </div>
        <div className="total_cost">Total Cost: {avTotalCost}</div>
      </div>

      {/*
      Setup Meal Planning Details Part of Page 
      Shows each Meal selection item, cost per item, and check button controls to select/deselect items
      Assumes Number of People number input field applies to all meals selected, default starts at numberOfPeople = 1
      */}
      <div id="meals" className="venue_container container_main">
        <div className="text"><h1>Meals Selection</h1></div>
        <div className="input-container venue_selection">
          <label htmlFor="numberOfPeople"><h3>Number of People:</h3></label>
          <input type="number" className="input_box5" id="numberOfPeople" value={numberOfPeople}
            onChange={(e) => { const value = parseInt(e.target.value);
              if (isNaN(value) || value < 1) {
                setNumberOfPeople(1);
                } 
                else {
                  setNumberOfPeople(value);
                }
            }}
          min="1"/>
        </div>

        <div className="meal_selection">
          {mealsItems.map((item, index) => (
            <div className="meal_item" key={index} style={{ padding: 15 }}>
            <div className="inner">
            <input type="checkbox" id={ `meal_${index}` }
              checked={ item.selected }
              onChange={() => handleMealSelection(index)}
            />
            <label htmlFor={`meal_${index}`}> {item.name} </label>
        </div>
        <div className="meal_cost">${item.cost}</div>
        </div>
      ))}
      </div>
        
        <div className="total_cost">Total Cost: {mealsTotalCost}</div>
      </div>
    
    </div>
      ) : 
      (
      <div className="total_amount_detail">
      <TotalCost totalCosts={totalCosts} handleClick={handleToggleItems} ItemsDisplay={() => <ItemsDisplay items={items}/>}/>
      </div>
      )
    }


  </div>
  </> 
  
  ); // end of return()

};  //end of ConferenceEvent() function

export default ConferenceEvent;
